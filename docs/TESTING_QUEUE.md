# Pending Testing Queue

This list tracks modules and scenarios that have been implemented but require thorough manual/user acceptance testing.

## 1. Notices Module
- [ ] **Creation & Targeting**: Admin creates a notice targeted to a specific block/flat. Verify only the targeted resident sees it in their feed.
- [ ] **Approval Workflow**: Admin creates a Notice requiring Manager approval. Log in as Manager, approve it. Verify it publishes.
- [ ] **Rejection Workflow**: Reject a Notice. Verify the status updates and the creator can see the rejection reason.
- [ ] **Acknowledgements**: Resident acknowledges a mandatory Notice. Verify the Admin sees the acknowledgement count increment.
- [ ] **Scheduled Notices**: Set a notice to publish 5 minutes in the future. Verify Celery automatically publishes it when the time arrives.
- [ ] **Media Uploads**: Attach a PDF/Image to a notice. Verify it uploads to Supabase and the resident can securely view/download it.

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

*(Add new testing items here as we progress through milestones)*
