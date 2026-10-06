# Pending Testing Queue

This list tracks modules and scenarios that have been implemented but require thorough manual/user acceptance testing.

## 1. Notices Module
- [x] **Creation & Targeting**: Admin creates a notice targeted to a specific role (Security/Manager) or block/flat. Verified only targeted users receive it in their feed and via Celery push notifications.
- [x] **Validation Error Feedback**: Friendly toast notifications for invalid input (e.g., `acknowledge_by` must be strictly in the future).
- [x] **Acknowledgements & Responses**: Resident/targeted recipient accepts or declines a mandatory Notice. Verified real-time status transitions (`Accepted ✓` / `Declined ✗`), pre-seeded `Pending` counts upon publish, and author metric updates (`X Accepted • Y Declined • Z Pending`).
- [x] **Modal Refactoring & Step Alignment**: Compact inline pill stepper (`Content` -> `Audience` -> `Scheduling`), unified form state management, 2-week default validity expiry, and acknowledgement deadline moved cleanly to the scheduling step.
- [x] **Backend Filtering & Sorting**: Verified server-side filtering by status (`Draft`, `Scheduled`, `Published`, `Cancelled`), category, and priority, along with full-text search and sort order.
- [ ] **Scheduled Notices (Live Celery Beat verification)**: Set a notice to publish in the future. Verify Celery Beat (`-B`) worker automatically processes and publishes it when the clock arrives (guarded by `select_for_update`).
- [ ] **Media Uploads**: Attach a PDF/Image to a notice. Verify it uploads to Supabase and the resident can securely view/download it (currently paused).

## 2. Visitor Management
- [ ] **Resident 30-sec Intercept**: Security adds a visitor. Verify the resident's screen instantly pops the modal.
- [ ] **Auto-Approve Fallback**: Security adds a visitor. Resident ignores it. Verify Celery approves it after 30 seconds.
- [ ] **Active Rejection**: Resident explicitly clicks "Reject Entry". Verify Security's dashboard instantly flips the status to Denied.

## 3. Amenity Booking
- [ ] **Resident Booking Submission**: Resident submits a booking slot for an amenity (e.g., Community Hall) with valid start/end times and purpose. Verify status is 'Pending Review'.
- [ ] **Validation & Overlap**: Verify validation prevents submitting end times earlier than start times or selecting past dates.
- [ ] **Manager Approval Flow**: Log in as Manager, navigate to Community -> Amenity Approvals, approve the booking. Verify status updates to Confirmed.
- [ ] **Manager Rejection Flow**: Manager rejects a pending booking. Verify status updates to Rejected.
- [ ] **Resident Cancellation**: Resident cancels their own pending or confirmed booking from the My Bookings table.

## 4. Emergency Directory & Broadcast
- [ ] **Trigger Global Broadcast**: As a Manager, trigger a 'Critical' Fire alert. Verify that the WebSocket immediately pushes the `ActiveAlertBanner` to a separate logged-in Resident's dashboard.
- [ ] **Role Authorization**: Verify that a standard Resident cannot see the "Trigger Broadcast" button or hit the POST API.
- [ ] **Resolution Flow**: Manager resolves the active broadcast. Verify the alert banner instantly disappears from all connected clients.
- [ ] **Directory Visibility**: Ensure residents can view the emergency contacts table, but only Managers/Security can add or remove contacts.

## 5. Helpdesk & SLA Escalation
- [ ] **SLA Escalation Task**: Create an issue and simulate/let time elapse past SLA threshold; verify Celery periodic task (`check_slas_and_escalate`) flags and escalates priority without excessive DB footprint.

*(Add new testing items here as we progress through milestones)*

