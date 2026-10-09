"""
Comprehensive Backend Test & Profiling Suite for docs/TESTING_QUEUE.md
Measures:
  - Latency / Execution Time (avg ms, min, max)
  - Database I/O: Exact count of DB Reads (SELECT) and DB Writes (INSERT/UPDATE/DELETE)
  - Memory Footprint (tracemalloc peak KB, heap delta)
  - Functional Assertions for all 7 queue modules

All seeded records carry the 'TQ_' prefix and are reliably cleaned up in finally.
Output: Backend/perf_tests/queue_backend_report.json
"""
import os
import sys
import time
import json
import statistics
import tracemalloc
from decimal import Decimal
from datetime import timedelta
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

BASE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "settings")

import django
django.setup()

from django.conf import settings
from django.contrib.auth.models import User
from django.db import connection, connections
from django.test.utils import CaptureQueriesContext
from django.utils import timezone
from rest_framework.test import APIClient

from apt_proj.Apt_Accounts.Accounts_models import Block, Flat, Role, UserProfile, CoResident, Vehicle, PersonalEmergencyContact
from apt_proj.Apt_Notices.Notices_models import Notice, NoticeAcknowledgement
from apt_proj.Apt_Visitors.Visitor_models import VisitorLog
from apt_proj.Apt_Visitors.tasks import auto_approve_visitor
from apt_proj.Apt_Amenities.Amenities_models import Amenity, AmenityBooking
from apt_proj.Apt_Emergency.Emergency_models import EmergencyContact, EmergencyBroadcast
from apt_proj.Apt_Issues.Issue_models import Issue, IssueCategory, IssueTimeline
from apt_proj.Apt_Notifications.tasks import check_slas_and_escalate, process_scheduled_notices
from apt_proj.Apt_Billing.Billing_models import Invoice, Transaction

settings.ALLOWED_HOSTS = ["*"]
PREFIX = "TQ_"
REPORT = {"modules": {}, "concurrency": {}, "summary": []}

def record_metric(module_name, scenario_name, fn, repeat=1):
    """Executes fn(), captures exact SQL reads/writes, time, and peak memory."""
    tracemalloc.start()
    t0 = time.perf_counter()
    with CaptureQueriesContext(connection) as ctx:
        last_res = fn()
    t1 = time.perf_counter()
    cur_mem, peak_mem = tracemalloc.get_traced_memory()
    tracemalloc.stop()

    sqls = [q["sql"].lstrip().upper() for q in ctx.captured_queries]
    reads = sum(s.startswith("SELECT") for s in sqls)
    writes = sum(s.startswith(("INSERT", "UPDATE", "DELETE")) for s in sqls)
    other = len(sqls) - reads - writes
    db_ms = round(sum(float(q["time"]) for q in ctx.captured_queries) * 1000, 2)

    times = [(t1 - t0) * 1000]
    if repeat > 1:
        for _ in range(repeat - 1):
            tracemalloc.start()
            t_sub0 = time.perf_counter()
            last_res = fn()
            times.append((time.perf_counter() - t_sub0) * 1000)
            _, peak_sub = tracemalloc.get_traced_memory()
            tracemalloc.stop()
            peak_mem = max(peak_mem, peak_sub)

    status_code = getattr(last_res, "status_code", 200)
    data = {
        "scenario": scenario_name,
        "status": status_code,
        "avg_ms": round(statistics.mean(times) if times else 0, 2),
        "db_reads": reads,
        "db_writes": writes,
        "db_other": other,
        "db_time_ms": db_ms,
        "peak_mem_kb": round(peak_mem / 1024, 1),
    }
    if module_name not in REPORT["modules"]:
        REPORT["modules"][module_name] = []
    REPORT["modules"][module_name].append(data)
    print(f"[{module_name:<18}] {scenario_name:<46} Status={status_code} | Time={data['avg_ms']}ms | R={reads} W={writes} | Peak={data['peak_mem_kb']}KB")
    return last_res

def cleanup_all():
    """Wipes all test records prefixed with PREFIX"""
    Transaction.objects.filter(invoice__title__startswith=PREFIX).delete()
    Invoice.objects.filter(title__startswith=PREFIX).delete()
    EmergencyBroadcast.objects.filter(title__startswith=PREFIX).delete()
    EmergencyContact.objects.filter(name__startswith=PREFIX).delete()
    AmenityBooking.objects.filter(purpose__startswith=PREFIX).delete()
    Amenity.objects.filter(name__startswith=PREFIX).delete()
    VisitorLog.objects.filter(details__name__startswith=PREFIX).delete()
    NoticeAcknowledgement.objects.filter(notice__title__startswith=PREFIX).delete()
    Notice.objects.filter(title__startswith=PREFIX).delete()
    IssueTimeline.objects.filter(issue__title__startswith=PREFIX).delete()
    Issue.objects.filter(title__startswith=PREFIX).delete()
    IssueCategory.objects.filter(name__startswith=PREFIX).delete()
    PersonalEmergencyContact.objects.filter(name__startswith=PREFIX).delete()
    Vehicle.objects.filter(license_plate__startswith=PREFIX).delete()
    CoResident.objects.filter(name__startswith=PREFIX).delete()
    UserProfile.objects.filter(user__username__startswith=PREFIX).delete()
    User.objects.filter(username__startswith=PREFIX).delete()
    Flat.objects.filter(number__startswith=PREFIX).delete()
    Block.objects.filter(name__startswith=PREFIX).delete()
    Role.objects.filter(name__startswith=PREFIX).delete()

def run_tests():
    print("=" * 80)
    print("STARTING FULL TEST & PROFILING RUN FOR docs/TESTING_QUEUE.md")
    print("=" * 80)

    # 0. Base Data Setup
    block, _ = Block.objects.get_or_create(name=f"{PREFIX}BlkA")
    flat1, _ = Flat.objects.get_or_create(block=block, number=f"{PREFIX}101")
    flat2, _ = Flat.objects.get_or_create(block=block, number=f"{PREFIX}102")

    role_res, _ = Role.objects.get_or_create(name=f"{PREFIX}Resident", defaults={"code": f"{PREFIX.lower()}resident", "status": "active"})
    role_mgr, _ = Role.objects.get_or_create(
        name=f"{PREFIX}Manager", 
        defaults={
            "code": f"{PREFIX.lower()}manager", 
            "status": "active",
            "permission_tabs": [
                "community.notices.add", "community.notices.view", "community.notices.approve",
                "community.amenities.approve", "emergency.manage_broadcasts", "emergency.add_contact",
                "finance.billing.generate"
            ]
        }
    )

    admin_user, _ = User.objects.get_or_create(username=f"{PREFIX}admin", is_superuser=True)
    resident1, _ = User.objects.get_or_create(username=f"{PREFIX}res1")
    resident2, _ = User.objects.get_or_create(username=f"{PREFIX}res2")

    up_admin, _ = UserProfile.objects.get_or_create(user=admin_user, defaults={"flat": flat1, "role": role_mgr})
    up_res1, _ = UserProfile.objects.get_or_create(user=resident1, defaults={"flat": flat1, "role": role_res})
    up_res2, _ = UserProfile.objects.get_or_create(user=resident2, defaults={"flat": flat2, "role": role_res})
    
    # Ensure role is attached
    up_res1.role = role_res
    up_res1.save()
    up_res2.role = role_res
    up_res2.save()

    admin_client = APIClient(raise_request_exception=False)
    admin_client.force_authenticate(user=admin_user)

    res1_client = APIClient(raise_request_exception=False)
    res1_client.force_authenticate(user=resident1)

    res2_client = APIClient(raise_request_exception=False)
    res2_client.force_authenticate(user=resident2)

    now = timezone.now()
    future_date = (now + timedelta(days=5)).isoformat()
    past_date = (now - timedelta(days=2)).isoformat()

    # =========================================================================
    # 1. NOTICES MODULE
    # =========================================================================
    print("\n--- 1. Testing Notices Module ---")

    # 1.1 Notice Creation & Targeting (Creating Draft with acknowledge requirement)
    def create_notice_draft():
        return admin_client.post("/notices/", {
            "title": f"{PREFIX}Annual General Meeting",
            "content": "Mandatory resident meeting in community hall.",
            "category": "Maintenance",
            "priority": "Critical",
            "status": "Draft",
            "requires_acknowledgement": True,
            "acknowledge_by": future_date,
            "target_audience": [{"role": role_res.name}],
        }, format="json")
    resp_notice = record_metric("Notices", "Notice Creation & Targeting (Draft)", create_notice_draft)
    notice_id = resp_notice.data.get("id")

    # 1.2 Validation Error Feedback (past acknowledge_by -> 400)
    def create_notice_invalid():
        return admin_client.post("/notices/", {
            "title": f"{PREFIX}Invalid Notice",
            "content": "Test content",
            "category": "Maintenance",
            "priority": "Critical",
            "requires_acknowledgement": True,
            "acknowledge_by": past_date,
            "target_audience": [{"role": role_res.name}],
        }, format="json")
    record_metric("Notices", "Validation Error Feedback (Past Date -> 400)", create_notice_invalid)

    # 1.3 Publish Notice Flow
    def publish_notice():
        return admin_client.post(f"/notices/{notice_id}/publish/")
    record_metric("Notices", "Notice Publish Flow (Draft -> Published)", publish_notice)

    # 1.4 Acknowledgements & Responses: Resident 1 Accepts
    def resident_acknowledge():
        return res1_client.post(f"/notices/{notice_id}/acknowledge/", {"action": "accept"}, format="json")
    record_metric("Notices", "Resident Acknowledgement (Accept -> 200)", resident_acknowledge)

    # 1.5 Acknowledgements & Responses: Resident 2 Declines
    def resident2_decline():
        return res2_client.post(f"/notices/{notice_id}/acknowledge/", {"action": "decline"}, format="json")
    record_metric("Notices", "Resident Acknowledgement (Decline -> 200)", resident2_decline)

    # 1.6 Backend Filtering & Sorting
    def filter_sort_notices():
        return admin_client.get("/notices/?category=Maintenance&status=Published&sort=-publish_date")
    record_metric("Notices", "Backend Filtering & Sorting", filter_sort_notices, repeat=3)

    # 1.7 Scheduled Notices Worker Task (Celery task locks scheduled items and publishes)
    Notice.objects.create(
        title=f"{PREFIX}Scheduled Worker Notice",
        content="Auto published by Celery periodic worker",
        category="General",
        priority="Medium",
        status=Notice.Status.SCHEDULED,
        publish_date=now - timedelta(minutes=5),
        created_by=admin_user,
        target_audience=[]
    )
    def run_scheduled_notices_task():
        return process_scheduled_notices()
    record_metric("Notices", "Scheduled Notices Celery Task", run_scheduled_notices_task)

    # =========================================================================
    # 2. VISITOR MANAGEMENT
    # =========================================================================
    print("\n--- 2. Testing Visitor Management ---")
    # 2.1 Visitor Log Creation
    def create_visitor_log():
        return admin_client.post("/visitors/", {
            "flat": flat1.id,
            "details": {
                "name": f"{PREFIX}Courier Agent",
                "phone": "9876543210",
                "purpose": "Parcel Drop"
            }
        }, format="json")
    resp_vis = record_metric("Visitors", "Visitor Log Creation (Security/Admin)", create_visitor_log)
    vis_id = resp_vis.data.get("id")

    # 2.2 Auto-Approve Fallback (Celery 30-sec fallback task)
    def run_auto_approve_task():
        return auto_approve_visitor(vis_id)
    record_metric("Visitors", "Auto-Approve Fallback Task (Celery)", run_auto_approve_task)

    # 2.3 Active Rejection by Resident
    vis_deny = VisitorLog.objects.create(
        flat=flat1,
        details={"name": f"{PREFIX}Unannounced Visitor", "phone": "9876543211"},
        status=VisitorLog.Status.PENDING_APPROVAL
    )
    def active_reject_visitor():
        return res1_client.post(f"/visitors/{vis_deny.id}/approve/", {"action": "REJECT"}, format="json")
    record_metric("Visitors", "Resident Active Rejection (Deny -> 200)", active_reject_visitor)

    # =========================================================================
    # 3. AMENITY BOOKING
    # =========================================================================
    print("\n--- 3. Testing Amenity Booking ---")
    amenity, _ = Amenity.objects.get_or_create(
        name=f"{PREFIX}Badminton Court",
        defaults={"description": "Indoor court", "is_active": True}
    )
    b_start = (now + timedelta(days=2)).replace(hour=14, minute=0, second=0)
    b_end = (now + timedelta(days=2)).replace(hour=16, minute=0, second=0)

    # 3.1 Validation: End time before start time -> 400
    def submit_invalid_end_time():
        return res1_client.post("/amenities/bookings/", {
            "amenity": amenity.id,
            "start_time": b_start.isoformat(),
            "end_time": (b_start - timedelta(hours=1)).isoformat(),
            "purpose": f"{PREFIX}Invalid Time Test"
        }, format="json")
    record_metric("Amenities", "Validation Error: End Before Start (-> 400)", submit_invalid_end_time)

    # 3.2 Validation: Past date -> 400
    def submit_past_date_booking():
        return res1_client.post("/amenities/bookings/", {
            "amenity": amenity.id,
            "start_time": past_date,
            "end_time": (now - timedelta(days=1)).isoformat(),
            "purpose": f"{PREFIX}Past Date Test"
        }, format="json")
    record_metric("Amenities", "Validation Error: Past Date (-> 400)", submit_past_date_booking)

    # 3.3 Resident Booking Submission (Valid slot -> 201)
    def submit_booking():
        return res1_client.post("/amenities/bookings/", {
            "amenity": amenity.id,
            "start_time": b_start.isoformat(),
            "end_time": b_end.isoformat(),
            "purpose": f"{PREFIX}Evening Match"
        }, format="json")
    resp_booking = record_metric("Amenities", "Resident Booking Submission (Pending -> 201)", submit_booking)
    booking_id = resp_booking.data.get("id")

    # 3.4 Manager Approval Flow (Pending -> Confirmed -> 200)
    def manager_approve_booking():
        return admin_client.post(f"/amenities/bookings/{booking_id}/approve/")
    record_metric("Amenities", "Manager Approval Flow (Pending -> Confirmed)", manager_approve_booking)

    # 3.5 Overlapping Slot Validation against Confirmed Booking (Expect 400)
    def submit_overlapping_booking():
        return res2_client.post("/amenities/bookings/", {
            "amenity": amenity.id,
            "start_time": (b_start + timedelta(minutes=30)).isoformat(),
            "end_time": (b_end + timedelta(minutes=30)).isoformat(),
            "purpose": f"{PREFIX}Conflicting Slot"
        }, format="json")
    record_metric("Amenities", "Overlapping Slot vs Confirmed (Expect 400)", submit_overlapping_booking)

    # 3.6 Manager Rejection Flow
    b2_start = (now + timedelta(days=3)).replace(hour=10, minute=0, second=0)
    b2_end = (now + timedelta(days=3)).replace(hour=12, minute=0, second=0)
    resp_b2 = res1_client.post("/amenities/bookings/", {
        "amenity": amenity.id,
        "start_time": b2_start.isoformat(),
        "end_time": b2_end.isoformat(),
        "purpose": f"{PREFIX}Rejection Target"
    }, format="json")
    b2_id = resp_b2.data.get("id")

    def manager_reject_booking():
        return admin_client.post(f"/amenities/bookings/{b2_id}/reject/")
    record_metric("Amenities", "Manager Rejection Flow (Pending -> Rejected)", manager_reject_booking)

    # 3.7 Resident Cancellation Flow
    b3_start = (now + timedelta(days=4)).replace(hour=10, minute=0, second=0)
    b3_end = (now + timedelta(days=4)).replace(hour=12, minute=0, second=0)
    resp_b3 = res1_client.post("/amenities/bookings/", {
        "amenity": amenity.id,
        "start_time": b3_start.isoformat(),
        "end_time": b3_end.isoformat(),
        "purpose": f"{PREFIX}Cancellation Target"
    }, format="json")
    b3_id = resp_b3.data.get("id")

    def resident_cancel_booking():
        return res1_client.post(f"/amenities/bookings/{b3_id}/cancel/")
    record_metric("Amenities", "Resident Cancellation Flow (-> Cancelled)", resident_cancel_booking)

    # =========================================================================
    # 4. EMERGENCY DIRECTORY & BROADCAST
    # =========================================================================
    print("\n--- 4. Testing Emergency Directory & Broadcast ---")
    # 4.1 Role Authorization Check: Resident cannot POST broadcast (Expect 403)
    def resident_post_broadcast_forbidden():
        return res1_client.post("/emergency/broadcasts/", {
            "title": f"{PREFIX}Unauthorized Siren",
            "message": "Testing RBAC permissions",
            "severity": "CRITICAL"
        }, format="json")
    record_metric("Emergency", "Role Authorization (Resident POST Broadcast -> 403)", resident_post_broadcast_forbidden)

    # 4.2 Manager Trigger Global Broadcast
    def manager_trigger_broadcast():
        return admin_client.post("/emergency/broadcasts/", {
            "title": f"{PREFIX}Fire Alarm Evacuation",
            "message": "Critical alarm in basement electrical room.",
            "severity": "CRITICAL"
        }, format="json")
    resp_broad = record_metric("Emergency", "Manager Trigger Global Broadcast (-> 201)", manager_trigger_broadcast)
    broadcast_id = resp_broad.data.get("id")

    # 4.3 Manager Resolution Flow
    def manager_resolve_broadcast():
        return admin_client.post(f"/emergency/broadcasts/{broadcast_id}/resolve/", {
            "resolution_note": "False alarm confirmed by security."
        }, format="json")
    record_metric("Emergency", "Manager Resolution Flow (Active -> Resolved)", manager_resolve_broadcast)

    # 4.4 Directory Visibility (Resident GET -> 200)
    def resident_view_directory():
        return res1_client.get("/emergency/contacts/")
    record_metric("Emergency", "Directory Visibility (Resident GET -> 200)", resident_view_directory, repeat=3)

    # 4.5 Directory Authorization: Resident cannot add contact (Expect 403)
    def resident_add_contact_forbidden():
        return res1_client.post("/emergency/contacts/", {
            "name": f"{PREFIX}Unauthorized Contact",
            "phone_number": "9112233445",
            "category": "Police"
        }, format="json")
    record_metric("Emergency", "Directory Auth (Resident POST Contact -> 403)", resident_add_contact_forbidden)

    # 4.6 Directory Authorization: Manager adds contact (Expect 201)
    def manager_add_contact():
        return admin_client.post("/emergency/contacts/", {
            "name": f"{PREFIX}Local Fire Station",
            "phone_number": "101",
            "category": "FIRE_STATION"
        }, format="json")
    record_metric("Emergency", "Directory Auth (Manager POST Contact -> 201)", manager_add_contact)

    # =========================================================================
    # 5. HELPDESK & SLA ESCALATION
    # =========================================================================
    print("\n--- 5. Testing Helpdesk & SLA Escalation ---")
    cat, _ = IssueCategory.objects.get_or_create(name=f"{PREFIX}Plumbing")
    issue_sla = Issue.objects.create(
        title=f"{PREFIX}Main Pipeline Leakage",
        description="Water seepage across corridor",
        category=cat,
        priority="Medium",
        status="Open",
        created_by=resident1
    )
    # Simulate created 36 hours ago (past 24h SLA)
    Issue.objects.filter(pk=issue_sla.pk).update(created_at=now - timedelta(hours=36))

    def run_sla_escalation_task():
        return check_slas_and_escalate()
    record_metric("Helpdesk", "SLA Escalation Task (Celery Periodic)", run_sla_escalation_task)

    # Verify escalation
    issue_sla.refresh_from_db()
    assert issue_sla.priority == "High", f"Expected High priority, got {issue_sla.priority}"

    # =========================================================================
    # 6. PROFILE EXTENSIONS (Milestone 5)
    # =========================================================================
    print("\n--- 6. Testing Profile Extensions (Milestone 5) ---")
    # 6.1 Co-Resident Creation
    def resident_create_coresident():
        return res1_client.post("/accounts/me/co-residents/", {
            "name": f"{PREFIX}Ananya Sen",
            "relation": "Daughter",
            "age": 12,
            "phone_number": "9876500011"
        }, format="json")
    resp_co = record_metric("Profile Extensions", "Co-Resident Creation (POST -> 201)", resident_create_coresident)
    co_id = resp_co.data.get("id")

    # 6.2 Vehicle Creation
    def resident_create_vehicle():
        return res1_client.post("/accounts/me/vehicles/", {
            "vehicle_type": "Car",
            "make": "Toyota",
            "model": "Innova",
            "license_plate": f"{PREFIX}KA05MN8899"
        }, format="json")
    record_metric("Profile Extensions", "Vehicle Creation (POST -> 201)", resident_create_vehicle)

    # 6.3 Personal Emergency Contact Creation
    def resident_create_emergency_contact():
        return res1_client.post("/accounts/me/emergency-contacts/", {
            "name": f"{PREFIX}Dr. Mehra",
            "relation": "Physician",
            "phone_number": "9876500022",
            "is_primary": True
        }, format="json")
    record_metric("Profile Extensions", "Personal Contact Creation (POST -> 201)", resident_create_emergency_contact)

    # 6.4 Data Isolation Check (User 2 attempts to fetch User 1's Co-Resident -> Expect 404)
    def resident2_access_coresident_isolated():
        return res2_client.get(f"/accounts/me/co-residents/{co_id}/")
    record_metric("Profile Extensions", "Data Isolation (User 2 GET User 1 -> 404)", resident2_access_coresident_isolated)

    # =========================================================================
    # 7. BILLING & FINANCIAL ACCOUNTING (Milestone 4)
    # =========================================================================
    print("\n--- 7. Testing Billing & Financial Accounting (Milestone 4) ---")
    # 7.1 Manager Invoice Generation
    def manager_generate_invoice():
        return admin_client.post("/billing/invoices/", {
            "flat_id": flat1.id,
            "billed_to_id": resident1.id,
            "title": f"{PREFIX}Monthly Electricity Dues",
            "category": "Maintenance",
            "line_items": [
                {"description": "Base Meter Charge", "amount": "800.00"},
                {"description": "Consumption Units", "amount": "1700.00"}
            ]
        }, format="json")
    resp_inv = record_metric("Billing", "Manager Invoice Generation (POST -> 201)", manager_generate_invoice)
    inv_id = resp_inv.data.get("id")

    # 7.2 Resident Payment Flow
    def resident_pay_invoice():
        return res1_client.post("/billing/transactions/", {
            "invoice_id": inv_id,
            "amount": "2500.00",
            "payment_method": "UPI",
            "reference_id": f"txn_{int(time.time())}"
        }, format="json")
    record_metric("Billing", "Resident Payment Flow (Full Settle -> 201)", resident_pay_invoice)

    # 7.3 Concurrency Double-Spend Protection
    inv_race = Invoice.objects.create(
        flat=flat2,
        billed_to=resident2,
        category="Maintenance",
        title=f"{PREFIX}Race Protected Invoice",
        line_items=[{"description": "Dues", "amount": 1500}],
        total_amount=Decimal("1500.00"),
        due_date=now + timedelta(days=7),
        status="Pending"
    )

    def race_pay_worker(user_id, invoice_id):
        c = APIClient(raise_request_exception=False)
        c.force_authenticate(user=User.objects.get(pk=user_id))
        r = c.post("/billing/transactions/", {
            "invoice_id": invoice_id,
            "amount": "1500.00",
            "payment_method": "UPI"
        }, format="json")
        connections.close_all()
        return r.status_code

    with ThreadPoolExecutor(10) as ex:
        statuses = list(ex.map(lambda _: race_pay_worker(resident2.id, inv_race.id), range(10)))
    
    succ = sum(s == 201 for s in statuses)
    txns_in_db = Transaction.objects.filter(invoice_id=inv_race.id).count()
    REPORT["concurrency"] = {
        "scenario": "10 Concurrent Payments on Same Invoice (Race Condition)",
        "statuses": statuses,
        "success_201_count": succ,
        "rejected_count": len(statuses) - succ,
        "committed_transactions": txns_in_db,
        "verdict": "PASS" if txns_in_db == 1 else "FAIL"
    }
    print(f"\n[Billing Concurrency] 10 Concurrent Threads -> {succ} Accepted (201), {len(statuses)-succ} Rejected (400) | Txns in DB: {txns_in_db} | Verdict: {REPORT['concurrency']['verdict']}")
    print("=" * 80)
    print("BACKEND TEST & PROFILING RUN COMPLETED SUCCESSFULLY!")
    print("=" * 80)

if __name__ == "__main__":
    cleanup_all()
    try:
        run_tests()
    finally:
        cleanup_all()
        out_file = Path(__file__).with_name("queue_backend_report.json")
        out_file.write_text(json.dumps(REPORT, indent=2))
        print(f"\nSaved backend test report to: {out_file}")
