# Apt_Proj Master Roadmap & Execution Plan

This document tracks the end-to-end execution roadmap across all modules of the Apt_Proj system.

---

## 📋 Execution Order & Milestones

### 🎯 Milestone 1: Notice Board Module — Phase 7 Frontend Integration (IN PROGRESS)
- [ ] **1.1 Notice Creation Modal & Media Upload**: Replace legacy file handling with the centralized `MediaUpload.tsx` component (supporting images/PDFs and proof tokens).
- [ ] **1.2 Dynamic Target Audience Builder**: Implement hierarchy targeting for Blocks, Flats, and User Roles.
- [ ] **1.3 Notice Details & Signed Media URLs**: Render signed download URLs for private notice attachments in `NoticeDetailsPanel.tsx`.
- [ ] **1.4 Resident Feed & Acknowledgement Flow**: Connect resident dashboard feed with `POST /api/notices/<id>/acknowledge/`.
- [ ] **1.5 Manager Approval Workflow**: Verify manager notice approvals/rejections and real-time status transitions in `NoticeApprovalsPage.tsx`.

---

### 🗄️ Milestone 2: Storage Maintenance & Orphan Garbage Collector
- [ ] **2.1 Periodic Celery Task**: Implement `purge_orphan_media` job to identify `upload_status='PENDING'` records older than 24 hours.
- [ ] **2.2 Supabase & DB Cleanup**: Safely delete unattached Supabase storage objects and corresponding Media database rows.

---

### 🛡️ Milestone 3: Resident Services & Community Features
- [ ] **3.1 Visitor Management & Gate Pass System**: Resident pass generation, security gate check-in/out, and visitor log history.
- [ ] **3.2 Amenity Booking**: Facility calendar, slot reservations, cancellation rules, and conflict handling.
- [ ] **3.3 Emergency Directory & Broadcast**: Instant emergency notices, SOS triggers, and guard intercom directory.

---

### 💳 Milestone 4: Billing & Financial Accounting Subsystem
- [ ] **4.1 Maintenance Dues Generation**: Scheduled recurring bill generation based on square footage or flat tier.
- [ ] **4.2 Payment Tracking & Receipt Storage**: Attach transaction proofs/receipts via the `Media` generic relation.
- [ ] **4.3 Defaulter Analytics & Statements**: Automated overdue reminders, penalty calculation, and downloadable statements.
