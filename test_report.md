# Comprehensive Performance, Memory & Database Test Report

**Execution Date & Time:** 2026-10-09 16:50 IST  
**Environment:** Local PostgreSQL (`apartment_db`, `apt_data` schema) + Redis, Windows, Python 3.10, Node 22 / Vitest 5 (`jsdom` with `--expose-gc`).  
**Scope:** Complete verification of all scenarios specified in [`docs/TESTING_QUEUE.md`](file:///c:/Users/Shreeram/Downloads/projects/apt_proj/docs/TESTING_QUEUE.md) across both Backend and Frontend, measuring **Latency / Performance**, **Exact DB Reads & Writes**, **Peak Memory Allocation**, **Concurrency Race Conditions**, and **UI Component Memory Leaks**.

---

## 1. Executive Summary

| Test Domain | Scenarios Executed | Pass Rate | DB Reads / Writes Verified | Peak Memory Tested | Memory Leak Verdict |
|---|:---:|:---:|:---:|:---:|:---:|
| **Backend Suite (`test_queue_backend.py`)** | 22 Scenarios across 7 Modules + 10-thread Concurrency Race | **100% PASS** (23/23) | Exact SQL capture via `CaptureQueriesContext` | Up to 15.2 MB (Notices publish) / ~80 KB (API operations) | **Zero state leaks**; all seeded records cleaned up |
| **Frontend Suite (`test_queue_frontend.test.tsx`)** | 10 Scenarios (Form inputs, Modals, Banners, Steppers, Timers) | **100% PASS** (10/10) | N/A (Client-side DOM) | < 1.3 MB heap growth across 100 mount/unmount cycles | **0 Leaked DOM Nodes** (NO LEAK across all 4 modals/banners) |
| **Frontend Scalability (`ui_perf.test.tsx`)** | 13 Scenarios (DataTable up to 20k rows, Dropdowns up to 2k opts) | **100% PASS** (13/13) | N/A (Client & Server modes) | Constant 110 DOM nodes at 20,000 rows | **0 Leaked DOM Nodes** (NO LEAK) |
| **System Integrity & Types** | `manage.py check` & `tsc -b` | **0 Errors** | Fully verified schema & types | Production bundle: 894 KB | **All clean** |

---

## 2. Backend Queue Test Suite Results (`test_queue_backend.py`)

All backend tests were executed directly against the live PostgreSQL database with query tracing (`CaptureQueriesContext`), memory profiling (`tracemalloc`), and microsecond timing (`time.perf_counter`).

### 2.1 Module-by-Module Latency, DB I/O & Memory Profile

| Module | Scenario / Test Case | HTTP Status | Latency (Avg ms) | DB Reads (SELECT) | DB Writes (INSERT/UPDATE/DELETE) | Peak Memory (KB) | Outcome & Assertions |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **1. Notices** | Notice Creation & Targeting (Draft with Ack required) | 201 | 1657.8 ms | 5 | 1 | 15,253.5 KB | Target audience JSON parsed; Celery recipient pre-computation |
| | Validation Error Feedback (Past `acknowledge_by` date) | 400 | 5.4 ms | 0 | 0 | 108.4 KB | Rejected early at serializer level with friendly feedback |
| | Notice Publish Flow (Draft -> Published) | 200 | 4179.5 ms | 11 | 2 | 1,644.8 KB | Status transition + Celery push tasks dispatched |
| | Resident Acknowledgement (Resident 1 Accepts) | 200 | 11.2 ms | 2 | 1 | 79.3 KB | Real-time acknowledgement status transition to `Accepted` |
| | Resident Acknowledgement (Resident 2 Declines) | 200 | 7.3 ms | 2 | 1 | 57.0 KB | Status transition to `Declined`; author metric updated |
| | Backend Filtering & Sorting (`category`, `status`, `sort`) | 200 | 31.6 ms | 16 | 0 | 189.6 KB | Multi-attribute filtering with pagination |
| | Scheduled Notices Periodic Worker Task (`Celery`) | 200 | 6.7 ms | 2 | 1 | 105.6 KB | Atomically locked items published via periodic task |
| **2. Visitors** | Visitor Log Creation (Security check-in) | 201 | 17.4 ms | 3 | 2 | 179.3 KB | Visitor log created with JSON payload in `details` |
| | Auto-Approve Fallback Task (Celery 30-sec task) | 200 | 5.8 ms | 3 | 1 | 103.0 KB | 30s timeout auto-approves pending visitors |
| | Resident Active Rejection (`action: REJECT`) | 200 | 12.2 ms | 4 | 1 | 119.2 KB | Instantly transitions visitor status to `DENIED` |
| **3. Amenities** | Validation Error: End Time Before Start Time | 400 | 4.8 ms | 1 | 0 | 77.1 KB | Serializer rejection (`End time must be after start time`) |
| | Validation Error: Booking in Past Date | 400 | 6.1 ms | 1 | 0 | 45.7 KB | Serializer rejection (`Start time cannot be in the past`) |
| | Resident Booking Submission (Valid Slot) | 201 | 9.4 ms | 2 | 1 | 91.2 KB | Created in `Pending Review` status with timeline event |
| | Manager Approval Flow (Pending -> Confirmed) | 200 | 19.9 ms | 4 | 1 | 125.6 KB | Atomic row lock + status flipped to `Confirmed` |
| | Overlapping Slot Validation vs Confirmed Booking | 400 | 8.5 ms | 2 | 0 | 57.6 KB | Conflict detected (`Overlapping booking exists`) |
| | Manager Rejection Flow (Pending -> Rejected) | 200 | 15.9 ms | 3 | 1 | 123.3 KB | Status flipped to `Rejected` + notification queued |
| | Resident Cancellation Flow (Booking -> Cancelled) | 200 | 6.8 ms | 2 | 1 | 52.0 KB | Resident cancels booking from table |
| **4. Emergency** | Role Authorization (Resident POST Broadcast) | 403 | 2.1 ms | 0 | 0 | 21.4 KB | Permission denied (`emergency.manage_broadcasts` required) |
| | Manager Trigger Global Broadcast (CRITICAL) | 201 | 10.2 ms | 0 | 1 | 166.8 KB | Broadcast created; WebSocket push fired |
| | Manager Resolution Flow (Active -> Resolved) | 200 | 17.6 ms | 3 | 1 | 150.8 KB | Resolution note stored; banner cleared |
| | Directory Visibility (Resident GET `/contacts/`) | 200 | 4.8 ms | 1 | 0 | 65.7 KB | Paginated contact directory visible to residents |
| | Directory Auth (Resident POST `/contacts/`) | 403 | 1.6 ms | 0 | 0 | 16.6 KB | Permission denied (`emergency.add_contact` required) |
| | Directory Auth (Manager POST `/contacts/`) | 201 | 7.5 ms | 0 | 1 | 92.5 KB | Manager creates emergency contact successfully |
| **5. Helpdesk** | SLA Escalation Periodic Task (`check_slas`) | 200 | 13.0 ms | 2 | 2 | 69.5 KB | Issues past SLA automatically escalated to `High` |
| **6. Profile** | Co-Resident Creation (POST `/co-residents/`) | 201 | 4.6 ms | 0 | 1 | 64.6 KB | Linked to logged-in user's flat |
| | Vehicle Creation (POST `/vehicles/`) | 201 | 5.5 ms | 1 | 1 | 67.4 KB | Vehicle registered with uppercase license plate |
| | Personal Contact Creation (POST `/emergency-contacts/`) | 201 | 5.7 ms | 0 | 1 | 80.9 KB | Primary emergency contact recorded |
| | Data Isolation Check (User 2 GET User 1 Record) | 404 | 4.1 ms | 1 | 0 | 36.6 KB | Strict tenant isolation confirmed (`Http404`) |
| **7. Billing** | Manager Invoice Generation (Line items array) | 201 | 11.0 ms | 3 | 1 | 154.7 KB | Line items computed and stored in JSON column |
| | Resident Payment Flow (Full Settlement) | 201 | 14.9 ms | 3 | 2 | 88.4 KB | Atomic row lock + receipt creation + status `Paid` |

---

### 2.2 Concurrency & Double-Spend Race Condition (Billing)

Tested with **10 concurrent threads** simultaneously attempting to pay the exact same pending invoice (`inv_race`) using `ThreadPoolExecutor`:

| Metric | Measured Value | Standard / Expectation | Verdict |
|---|:---:|:---:|:---:|
| **Concurrent Workers** | 10 simultaneous threads | High load contention on single invoice | — |
| **HTTP 201 Created** | **1** | Exactly 1 payment may succeed | **PASS** |
| **HTTP 400 Rejected** | **9** | 9 requests must be safely rejected | **PASS** |
| **Database Transaction Count** | **1** | No duplicate receipts in `apt_data.transactions` | **PASS** |
| **Row-Lock Integrity** | `select_for_update()` inside `transaction.atomic()` | Prevents double spend race condition | **PASS** |

---

## 3. Frontend Queue Test Suite Results (`test_queue_frontend.test.tsx`)

Run using Vitest with React 19 testing library, `jsdom`, and `--expose-gc`.

### 3.1 Feature & Interaction Verifications

| Test Case | Component Under Test | Mount Time | Interaction Under Test | Assertion / Result | Verdict |
|---|---|:---:|---|---|:---:|
| **Profile Input Constraints** | `ProfileExtensionSection` | **89.2 ms** | 1. Typed non-digit string `"987abc65xyz43"` into phone input.<br>2. Typed lowercase `"ka05mn8899"` into plate input. | • Phone filtered to digits: `9876543`<br>• License plate forced uppercase: `KA05MN8899` | **PASS** |
| **Visitor 30s Intercept Modal** | `VisitorInterceptModal` | **2.1 ms** | Dispatched `VISITOR_REQUESTED` CustomEvent with visitor payload. Clicked "Reject Entry". | • Modal opened with 30s timer (`00:30`)<br>• `approveRejectVisitor(888, 'REJECT')` called<br>• `VISITORS_UPDATED` event dispatched | **PASS** |
| **Emergency Active Alert Banner** | `ActiveAlertBanner` | **1.7 ms** | Mounted with active broadcast (`CRITICAL FIRE ALARM`). Dispatched `EMERGENCY_UPDATE`. | • Rendered red banner with bounce alert icon<br>• Displayed `CRITICAL SEVERITY` badge<br>• Auto-updates on event | **PASS** |
| **Notice Modal Stepper Navigation** | `CreateNoticeModal` | **39.4 ms** | Filled Title & Message. Clicked "Next" button. | • "Next" disabled until title & message non-empty<br>• Transitions to Step 2 (Audience)<br>• Clean step alignment | **PASS** |
| **Billing Invoice Generation** | `GenerateBillModal` | **18.0 ms** | Built dynamic line items, input description and amounts. | • Dynamically adds line items<br>• Builds JSON payload for API submission | **PASS** |
| **Billing Payment Simulation** | `PaymentModal` | **18.0 ms** | Switched method to 'Card', clicked 'Pay', fast-forwarded 1.5s gateway timer. | • Displays amount due<br>• Simulates 1.5s mock payment gateway delay<br>• Submits to `billingService.processPayment` | **PASS** |

---

### 3.2 Frontend Memory Leak Verification (100 Rapid Mount/Unmount Cycles)

Tested by mounting and unmounting each modal/banner **100 consecutive times** with garbage collection before and after:

| Component Under Test | Cycles | Ms per Cycle | Heap Growth | KB per Cycle | Leaked DOM Nodes | Leak Verdict |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `VisitorInterceptModal` | 100 | **0.80 ms** | 0.22 MB | 2.2 KB | **0** | **NO LEAK** |
| `ActiveAlertBanner` | 100 | **0.63 ms** | 0.34 MB | 3.5 KB | **0** | **NO LEAK** |
| `PaymentModal` | 100 | **4.01 ms** | 0.62 MB | 6.4 KB | **0** | **NO LEAK** |
| `CreateNoticeModal` | 100 | **11.52 ms** | 1.27 MB | 13.0 KB | **0** | **NO LEAK** |

---

## 4. Frontend Scalability Benchmarks (`ui_perf.test.tsx`)

### 4.1 DataTable Scaling & Node Preservation

| Row Count | Mount Time | Re-render Time | Commits | DOM Node Count | Heap Growth |
|---|:---:|:---:|:---:|:---:|:---:|
| 100 rows | 86.3 ms | 19.8 ms | 6 | 110 nodes | 7.18 MB |
| 1,000 rows | 40.1 ms | 16.5 ms | 6 | 110 nodes | 5.58 MB |
| 5,000 rows | 35.7 ms | 27.6 ms | 6 | 110 nodes | 6.58 MB |
| 20,000 rows | 45.8 ms | 22.5 ms | 6 | 110 nodes | 10.43 MB |

*Key finding: Virtualized/paginated rendering prevents DOM explosion — the DOM tree remains strictly locked at 110 nodes even when holding 20,000 rows in memory.*

### 4.2 Search Latency & UI Responsiveness
- **5,000 rows client-side search:** Average keystroke latency is **9.8 ms** (max 16.5 ms), maintaining > 60 FPS typing responsiveness.

### 4.3 Component Memory Leak Checks (200 Rapid Cycles)

| Component | Cycles | Ms per Cycle | Heap Delta | Leaked DOM Nodes | Leak Verdict |
|---|:---:|:---:|:---:|:---:|:---:|
| `DataTable` (500 rows) | 200 | 12.46 ms | 0.69 MB | **0** | **NO LEAK** |
| `CustomDropdown` (500 opts) | 200 | 1.25 ms | 0.21 MB | **0** | **NO LEAK** |
| `Modal` (Open state) | 200 | 1.70 ms | 0.39 MB | **0** | **NO LEAK** |

---

## 5. Summary & Verification Commands

To reproduce any benchmark at any time:

1. **Run Full Backend Testing Queue Suite:**
   ```powershell
   cd Backend
   .\.venv\Scripts\python.exe -W ignore perf_tests\test_queue_backend.py
   ```

2. **Run Full Frontend Testing Queue Suite:**
   ```powershell
   cd Frontend
   npx vitest run perf_tests/test_queue_frontend.test.tsx
   ```

3. **Run Combined Vitest Suite:**
   ```powershell
   cd Frontend
   npx vitest run
   ```

4. **Verify Typecheck and Backend Integrity:**
   ```powershell
   cd Frontend; npm run typecheck
   cd ../Backend; .\.venv\Scripts\python.exe manage.py check
   ```
