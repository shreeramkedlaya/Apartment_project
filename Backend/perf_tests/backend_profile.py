"""
Backend profiler (time / DB reads+writes / memory / concurrency).

Run from Backend/:   python perf_tests/backend_profile.py [--invoices 1000]

Uses the configured dev Postgres DB. All seeded rows carry the PERF_ marker and
are deleted in `finally`, so nothing is left behind. Output: perf_tests/backend_report.json
"""
import argparse
import json
import os
import statistics
import sys
import threading
import time
import tracemalloc
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from decimal import Decimal
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "settings")

import django  # noqa: E402

django.setup()

from django.conf import settings  # noqa: E402
from django.contrib.auth.models import User  # noqa: E402
from django.db import connection, connections, reset_queries  # noqa: E402
from django.test.utils import CaptureQueriesContext  # noqa: E402
from django.utils import timezone  # noqa: E402
from rest_framework.test import APIClient  # noqa: E402

from apt_proj.Apt_Accounts.Accounts_models import Block, Flat, UserProfile  # noqa: E402
from apt_proj.Apt_Billing.Billing_models import Invoice, Transaction  # noqa: E402

settings.ALLOWED_HOSTS = ["*"]
MARK = "PERF_"
RESULTS = {"scenarios": [], "concurrency": [], "notes": []}


def measure(name, fn, repeat=5):
    """Run fn() `repeat` times; capture latency, queries (reads/writes), memory."""
    times, last = [], None
    # warm-up (not measured) so import/cache cost is excluded
    fn()
    with CaptureQueriesContext(connection) as ctx:
        fn()
    sqls = [q["sql"].lstrip().upper() for q in ctx.captured_queries]
    reads = sum(s.startswith("SELECT") for s in sqls)
    writes = sum(s.startswith(("INSERT", "UPDATE", "DELETE")) for s in sqls)
    other = len(sqls) - reads - writes
    db_ms = round(sum(float(q["time"]) for q in ctx.captured_queries) * 1000, 2)

    tracemalloc.start()
    for _ in range(repeat):
        t = time.perf_counter()
        last = fn()
        times.append((time.perf_counter() - t) * 1000)
    cur, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()

    size = len(getattr(last, "content", b"") or b"")
    row = {
        "name": name,
        "status": getattr(last, "status_code", None),
        "avg_ms": round(statistics.mean(times), 2),
        "p95_ms": round(sorted(times)[max(0, int(len(times) * 0.95) - 1)], 2),
        "min_ms": round(min(times), 2),
        "max_ms": round(max(times), 2),
        "db_reads": reads,
        "db_writes": writes,
        "db_other": other,
        "db_time_ms": db_ms,
        "peak_mem_kb": round(peak / 1024, 1),
        "resp_kb": round(size / 1024, 1),
    }
    RESULTS["scenarios"].append(row)
    print(f"{name:<44} {row['status']} avg={row['avg_ms']}ms r={reads} w={writes} peak={row['peak_mem_kb']}KB")
    return row


def seed(n):
    block, _ = Block.objects.get_or_create(name=f"{MARK}B")
    flat, _ = Flat.objects.get_or_create(block=block, number=f"{MARK}101")
    user, _ = User.objects.get_or_create(username=f"{MARK}user")
    UserProfile.objects.get_or_create(user=user, defaults={"flat": flat})
    due = timezone.now() + timedelta(days=7)
    Invoice.objects.bulk_create(
        [
            Invoice(
                flat=flat, billed_to=user, category="Maintenance", title=f"{MARK}inv{i}",
                line_items=[{"description": "Maintenance", "amount": 1500}],
                total_amount=Decimal("1500.00"), due_date=due,
                status="Pending" if i % 3 else "Overdue",
            )
            for i in range(n)
        ],
        batch_size=500,
    )
    return flat, user


def cleanup():
    Transaction.objects.filter(invoice__title__startswith=MARK).delete()
    Invoice.objects.filter(title__startswith=MARK).delete()
    UserProfile.objects.filter(user__username__startswith=MARK).delete()
    User.objects.filter(username__startswith=MARK).delete()
    Flat.objects.filter(number__startswith=MARK).delete()
    Block.objects.filter(name__startswith=MARK).delete()


def pay_worker(user_id, invoice_id):
    c = APIClient(raise_request_exception=False)
    c.force_authenticate(user=User.objects.get(pk=user_id))
    t = time.perf_counter()
    r = c.post("/billing/transactions/", {"invoice_id": invoice_id, "amount": "1500.00", "payment_method": "UPI"}, format="json")
    ms = (time.perf_counter() - t) * 1000
    connections.close_all()
    return r.status_code, ms


def run(n):
    flat, user = seed(n)
    client = APIClient(raise_request_exception=False)
    client.force_authenticate(user=user)
    inv_ids = list(Invoice.objects.filter(title__startswith=MARK).values_list("id", flat=True))
    pay_pool = iter(inv_ids)

    # ---- Billing: reads / writes
    measure(f"GET billing/invoices/ ({n} rows, unpaginated)", lambda: client.get("/billing/invoices/"))
    measure("GET billing/invoices/?page=1 (paginated 10 rows)", lambda: client.get("/billing/invoices/?page=1"))
    measure("GET billing/invoices/?status=Pending", lambda: client.get("/billing/invoices/?status=Pending"))
    measure("GET billing/invoices/<id>/", lambda: client.get(f"/billing/invoices/{inv_ids[0]}/"))
    measure(
        "POST billing/invoices/ (create)",
        lambda: client.post("/billing/invoices/", {
            "flat_id": flat.id, "billed_to_id": user.id, "title": f"{MARK}new",
            "line_items": [{"description": "x", "amount": 100}, {"description": "y", "amount": 50}],
        }, format="json"),
    )
    # payment: select_for_update + atomic (commits for real -> exercises lock behaviour)
    measure(
        "POST billing/transactions/ (pay)",
        lambda: client.post("/billing/transactions/", {
            "invoice_id": next(pay_pool), "amount": "1500.00", "payment_method": "UPI"}, format="json"),
        repeat=5,
    )

    # ---- Other module reads (status code recorded; 403 = needs role permission)
    for label, url in [
        ("GET accounts/blocks/", "/accounts/blocks/"),
        ("GET accounts/me/", "/accounts/auth/me/"),
        ("GET accounts/me/vehicles/", "/accounts/me/vehicles/"),
        ("GET accounts/me/co-residents/", "/accounts/me/co-residents/"),
        ("GET accounts/me/emergency-contacts/", "/accounts/me/emergency-contacts/"),
        ("GET issues/", "/issues/"),
        ("GET notices/my-notices/", "/notices/my-notices/"),
        ("GET visitors/", "/visitors/"),
        ("GET amenities/", "/amenities/"),
        ("GET amenities/bookings/", "/amenities/bookings/"),
        ("GET dashboard/summary/", "/dashboard/summary/"),
    ]:
        measure(label, lambda u=url: client.get(u))

    # ---- Concurrency: distinct invoices
    remaining = [i for i in inv_ids if i not in set(Transaction.objects.values_list("invoice_id", flat=True))]
    for workers in (5, 20):
        ids = remaining[:workers]
        remaining = remaining[workers:]
        t = time.perf_counter()
        with ThreadPoolExecutor(workers) as ex:
            out = list(ex.map(lambda i: pay_worker(user.id, i), ids))
        wall = (time.perf_counter() - t) * 1000
        lat = [o[1] for o in out]
        RESULTS["concurrency"].append({
            "case": f"{workers} parallel payments (distinct invoices)",
            "statuses": sorted({o[0] for o in out}), "wall_ms": round(wall, 1),
            "avg_ms": round(statistics.mean(lat), 1), "max_ms": round(max(lat), 1),
            "throughput_rps": round(workers / (wall / 1000), 1),
        })
    # ---- Concurrency: double-spend race on ONE invoice
    target = remaining[0]
    with ThreadPoolExecutor(10) as ex:
        out = list(ex.map(lambda _: pay_worker(user.id, target), range(10)))
    ok = sum(o[0] == 201 for o in out)
    txns = Transaction.objects.filter(invoice_id=target).count()
    RESULTS["concurrency"].append({
        "case": "10 simultaneous payments, SAME invoice (double-spend race)",
        "statuses": sorted({o[0] for o in out}), "created_201": ok, "transactions_in_db": txns,
        "verdict": "PASS" if txns == 1 else f"FAIL - {txns} transactions recorded for one invoice",
    })

    # ---- Integrity: plain invoice pay twice
    r = client.post("/billing/transactions/", {"invoice_id": target, "amount": "1500", "payment_method": "UPI"}, format="json")
    RESULTS["notes"].append(f"Re-pay already-paid invoice -> HTTP {r.status_code} (expect 400)")
    r = client.post("/billing/transactions/", {"invoice_id": remaining[1], "amount": "1", "payment_method": "UPI"}, format="json")
    RESULTS["notes"].append(
        f"Underpayment (amount=1 vs 1500) -> HTTP {r.status_code}; invoice status now "
        f"{Invoice.objects.get(pk=remaining[1]).status} (expect rejection / partial)"
    )

    # ---- DB-level: index / plan for the list query
    with connection.cursor() as cur:
        cur.execute("EXPLAIN ANALYZE SELECT * FROM apt_data.invoices WHERE status='Pending' ORDER BY created_at DESC")
        RESULTS["notes"].append("EXPLAIN invoices?status=Pending: " + " | ".join(r[0] for r in cur.fetchall()[:3]))
        cur.execute("SELECT pg_size_pretty(pg_total_relation_size('apt_data.invoices'))")
        RESULTS["notes"].append("invoices table size: " + cur.fetchone()[0])
        cur.execute("SELECT indexname FROM pg_indexes WHERE schemaname='apt_data' AND tablename='invoices'")
        RESULTS["notes"].append("invoices indexes: " + ", ".join(r[0] for r in cur.fetchall()))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--invoices", type=int, default=1000)
    ap.add_argument("--simulate-fix", action="store_true",
                    help="wrap TransactionCreateAPIView.post in atomic() at runtime (source untouched)")
    a = ap.parse_args()
    RESULTS["mode"] = "simulated-fix" if a.simulate_fix else "as-is"
    if a.simulate_fix:
        from django.db import transaction as _tx
        from apt_proj.Apt_Billing.views.transaction_views import TransactionCreateAPIView as _V
        _orig = _V.post
        _V.post = lambda self, request: _tx.atomic()(lambda: _orig(self, request))()
    suffix = "_fixed" if a.simulate_fix else ""
    cleanup()
    try:
        run(a.invoices)
    finally:
        cleanup()
        out = Path(__file__).with_name(f"backend_report{suffix}.json")
        out.write_text(json.dumps(RESULTS, indent=2, default=str))
        print("report ->", out)
