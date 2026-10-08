# Application Demo Script

This script outlines the role-specific actions and features across the 5 primary modules. Use this to guide your demonstration and showcase the robust permission matrix and real-time capabilities of the platform.

---

## 1. Notices & Communications

### **Manager / Admin**
- **Draft & Publish**: Can create rich-text notices and choose a target audience (e.g., all residents, specific blocks, or specific flats).
- **Scheduled Publishing**: Can set a future date/time for the notice to automatically publish (handled reliably via the Celery periodic worker).
- **Mandatory Acknowledgements**: Can enforce mandatory acknowledgements and track real-time analytics on who has accepted, declined, or is pending.

### **Resident**
- **View & Acknowledge**: Receives real-time push/WebSocket notifications for new notices. Can read notices and click "Accept" or "Decline" on mandatory notices.
- **Filtering & Search**: Can search through historical notices or filter by category and priority using server-side "Golden Logic."

---

## 2. Visitor Management

### **Gate Security**
- **Log Entry**: Can quickly log a new visitor at the gate. Submitting instantly triggers a 30-second intercept request to the destination resident.
- **Live Status Monitoring**: The security dashboard updates in real-time when a resident actively "Approves" or "Rejects" the entry.

### **Resident**
- **Instant Intercept**: Receives an instant, screen-taking modal (via WebSockets) when a visitor is at the gate for their flat.
- **Active Approval/Rejection**: Can click "Allow Entry" or "Reject Entry" with immediate feedback sent back to the Security dashboard.
- **Auto-Approval**: If the resident is away from their device, the system automatically approves the visitor after the 30-second window expires to prevent gate bottlenecks.

---

## 3. Amenity Booking

### **Resident**
- **Booking Submission**: Can select a facility (e.g., Community Hall), pick a valid date/time slot, and submit the booking request.
- **Validation**: System prevents overlapping requests with confirmed bookings and blocks past-date selection.
- **Cancellation**: Can self-cancel their own pending or confirmed bookings from their history table.

### **Manager / Admin**
- **Approvals Dashboard**: Has access to a dedicated dashboard to review all pending amenity requests.
- **Concurrency-Safe Approvals**: Can safely "Approve" or "Reject" requests. The backend safely prevents double-booking race conditions using transactional locks (`select_for_update`).
- **Timeline Tracking**: Every action (Request, Approval, Cancellation) is securely logged in a unified JSON timeline attached to the booking.

---

## 4. Emergency Directory & Broadcast

### **Manager / Security**
- **Trigger Broadcasts**: Can trigger global, high-priority emergency broadcasts (e.g., "Critical Fire Alert").
- **Resolution**: Can resolve active broadcasts once the emergency has passed, which instantly retracts the alert across all connected clients.
- **Directory Management**: Can add, update, or remove critical contacts (hospitals, fire stations) from the Emergency Directory.

### **Resident**
- **Live Alert Banner**: If a Manager triggers an emergency, the resident's screen will instantly display a flashing `ActiveAlertBanner` regardless of what page they are on.
- **Directory Visibility**: Has read-only access to the Emergency Directory with pagination and search functionality. They are strictly blocked from triggering broadcasts or modifying contacts.

---

## 5. Helpdesk & SLA Escalation

### **Resident**
- **Ticket Creation**: Can raise helpdesk issues (e.g., Plumbing, Electrical) attached to their flat or a common area.
- **Status Tracking**: Can monitor the real-time status of their issues (Open, In Progress, Resolved).

### **Manager / Admin**
- **Issue Assignment**: Can acknowledge, assign, and resolve tickets.
- **Automated SLA Escalation**: If an issue sits in 'Open' or 'Acknowledged' state for over 24 hours, the system (via Celery background tasks) automatically escalates the priority to "High" and dispatches a breach notification to managers.
- **Hybrid Timeline**: Can view the complete history of the ticket, tracking every status change, escalation, and comment efficiently via the JSON timeline model.
