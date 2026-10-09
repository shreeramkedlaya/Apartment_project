# Pending Testing Queue

This list tracks modules and scenarios that have been implemented but require thorough manual/user acceptance testing.

## 1. Notices Module
- [x] **Creation & Targeting**: Admin creates a notice targeted to a specific role (Security/Manager) or block/flat. Verified only targeted users receive it in their feed and via Celery push notifications.
- [x] **Validation Error Feedback**: Friendly toast notifications for invalid input (e.g., `acknowledge_by` must be strictly in the future).
- [x] **Acknowledgements & Responses**: Resident/targeted recipient accepts or declines a mandatory Notice. Verified real-time status transitions (`Accepted ✓` / `Declined ✗`), pre-seeded `Pending` counts upon publish, and author metric updates (`X Accepted • Y Declined • Z Pending`).
- [x] **Modal Refactoring & Step Alignment**: Compact inline pill stepper (`Content` -> `Audience` -> `Scheduling`), unified form state management, 2-week default validity expiry, and acknowledgement deadline moved cleanly to the scheduling step.
- [x] **Backend Filtering & Sorting**: Verified server-side filtering by status (`Draft`, `Scheduled`, `Published`, `Cancelled`), category, and priority, along with full-text search and sort order.
- [x] **Scheduled Notices (Live Celery Beat verification)**: Set a notice to publish in the future. Verified periodic worker task (`process_scheduled_notices`) atomically locks scheduled items with `select_for_update(skip_locked=True)`, transitions status to `Published`, and triggers push notifications & pending acknowledgements.
- [ ] **Media Uploads**: Attach a PDF/Image to a notice. Verify it uploads to Supabase and the resident can securely view/download it (currently paused).

## 2. Visitor Management
- [x] **Resident 30-sec Intercept**: Security adds a visitor. Verify the resident's screen instantly pops the modal.
- [x] **Auto-Approve Fallback**: Security adds a visitor. Resident ignores it. Verify Celery approves it after 30 seconds.
- [x] **Active Rejection**: Resident explicitly clicks "Reject Entry". Verify Security's dashboard instantly flips the status to Denied.

## 3. Amenity Booking
- [x] **Resident Booking Submission**: Resident submits a booking slot for an amenity (e.g., Community Hall) with valid start/end times and purpose. Verify status is 'Pending Review'.
- [x] **Validation & Overlap**: Verify validation prevents submitting end times earlier than start times or selecting past dates.
- [x] **Manager Approval Flow**: Log in as Manager, navigate to Community -> Amenity Approvals, approve the booking. Verify status updates to Confirmed.
- [x] **Manager Rejection Flow**: Manager rejects a pending booking. Verify status updates to Rejected.
- [x] **Resident Cancellation**: Resident cancels their own pending or confirmed booking from the My Bookings table.

## 4. Emergency Directory & Broadcast
- [x] **Trigger Global Broadcast**: As a Manager, trigger a 'Critical' Fire alert. Verify that the WebSocket immediately pushes the `ActiveAlertBanner` to a separate logged-in Resident's dashboard.
- [x] **Role Authorization**: Verify that a standard Resident cannot see the "Trigger Broadcast" button or hit the POST API.
- [x] **Resolution Flow**: Manager resolves the active broadcast. Verify the alert banner instantly disappears from all connected clients.
- [x] **Directory Visibility**: Ensure residents can view the emergency contacts table, but only Managers/Security can add or remove contacts.

## 5. Helpdesk & SLA Escalation
- [x] **SLA Escalation Task**: Create an issue and simulate/let time elapse past SLA threshold; verify Celery periodic task (`check_slas_and_escalate`) flags and escalates priority without excessive DB footprint.

## 6. Profile Extensions (Milestone 5)
- [x] **Co-Resident / Vehicle / Contact Creation**: Add a new Co-Resident, Vehicle, and Emergency Contact in the Profile Page. Verified they correctly render in the table and display toaster notifications upon success.
- [x] **Input Constraints**: Verified that typing letters into the phone number field filters them out automatically, and typing into the License Plate field forces uppercase.
- [x] **Data Isolation**: Log in as a completely different user and verify that they cannot see or modify the previous user's profile extensions (404 isolation confirmed).

## 7. Billing & Financial Accounting (Milestone 4)
- [x] **Manager Invoice Generation**: Log in as Manager with `finance.billing.generate` permissions. Ensure "Generate Invoice" button is visible and modal correctly builds a Line-Item array to POST.
- [x] **Resident Payment Flow**: Log in as a Resident. Verified "Generate Invoice" is hidden, but the "Pay Now" button appears on Pending/Overdue bills.
- [x] **Mock Razorpay/UPI Processing**: Click Pay Now, select a method, and verified the mock loader runs for 1.5s, successfully hits `POST /api/billing/transactions/`, flips the bill to Paid, and updates the local table without a hard refresh.
- [x] **Double-Spend & Concurrency Protection**: Verified 10 concurrent payments on identical invoice results in 1 success (201) and 9 rejections (400) with row-level locks.

*(Add new testing items here as we progress through milestones)*