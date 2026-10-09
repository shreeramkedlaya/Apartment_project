# Apt_Proj Master Roadmap & Execution Plan

This document tracks the end-to-end execution roadmap across all modules of the Apt_Proj system.

---

## 📋 Execution Order & Milestones

### 🎯 Milestone 1: Notice Board Module — Phase 7 Frontend Integration (COMPLETED)
- [x] **1.1 Notice Creation Modal & Media Upload**: Replace legacy file handling with the centralized `MediaUpload.tsx` component (supporting images/PDFs and proof tokens).
- [x] **1.2 Dynamic Target Audience Builder**: Implement hierarchy targeting for Blocks, Flats, and User Roles.
- [x] **1.3 Notice Details & Signed Media URLs**: Render signed download URLs for private notice attachments in `NoticeDetailsPanel.tsx`.
- [x] **1.4 Resident Feed & Acknowledgement Flow**: Connect resident dashboard feed with `POST /api/notices/<id>/acknowledge/`.
- [x] **1.5 Manager Approval Workflow**: Verify manager notice approvals/rejections and real-time status transitions in `NoticeApprovalsPage.tsx`.

---

### 🗄️ Milestone 2: Storage Maintenance & Orphan Garbage Collector (COMPLETED)
- [x] **2.1 Periodic Celery Task**: Implement `purge_orphan_media` job to identify `upload_status='PENDING'` records older than 24 hours.
- [x] **2.2 Supabase & DB Cleanup**: Safely delete unattached Supabase storage objects and corresponding Media database rows.

---

### 🛡️ Milestone 3: Resident Services & Community Features
- [x] **3.1 Visitor Management**: Security logs the visitor at the gate -> Resident gets a 30-second window to reject the entry -> Celery automatically approves them if no action is taken. No complex pre-approval passes needed, just the live 30-second approval window.
- [x] **3.2 Amenity Booking**: Full-stack reservation system for community amenities (facility listings, resident booking modals with slot validation, cancellation, and manager approval/rejection workflows).
- [x] **3.3 Emergency Directory & Broadcast**: Fully implemented (Directory CRUD, Hybrid JSON schema, Trigger Broadcast Modals, and Dashboard-wide Active Alert Banner connected via WebSockets).

---

### 💳 Milestone 4: Billing & Financial Accounting Subsystem (COMPLETED)
- [x] **4.1 Maintenance Dues Generation**: Manager manually generates bills which are directly assigned to the respective members/flats.
- [x] **4.2 Transaction Tracking**: Implemented a unified `Transaction` API and model (simulating Razorpay) securely using atomic locks to flip Invoice status.
- [x] **4.3 Defaulter Analytics & Reminders**: Refactored the unified `BillingPage.tsx` dashboard to clearly label Overdue/Pending states with intuitive mock Payment modaling.

---

### 👤 Milestone 5: Resident Profile Extensions (COMPLETED)
- [x] **5.1 Family & Co-Residents**: Allow users to add family members, dependents, or roommates to their flat.
- [x] **5.2 Vehicle Registration**: Allow residents to register their cars and motorcycles (Make, Model, License Plate).
- [x] **5.3 Emergency Contacts**: Add primary and secondary emergency contacts.
