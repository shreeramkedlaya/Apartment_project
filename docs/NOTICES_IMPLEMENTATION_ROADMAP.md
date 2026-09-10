# Notices Module: Implementation Roadmap

This document outlines the strict bottom-up approach (Phase 1 to Phase 6) for implementing the Notices module. All code must adhere to the project's explicit rules, particularly placing logic in the Service layer and avoiding generic `ModelViewSet` classes in favor of explicit `APIView`s.

---

## ✅ Phase 1 — Serializer Layer (COMPLETED)
**Location:** `Backend/apt_proj/Apt_Notices/serializers/`
Focus: Pure data validation before touching the database.

* `notice_serializer.py`: 
  * Validates `title` and `content` are present.
  * Validates `target_audience` is a non-empty valid JSON structure.
  * Ensures `valid_until` (if provided) is strictly greater than `publish_date`.
  * Ensures `acknowledge_by` (if provided) is strictly in the future.
* `notice_attachment_serializer.py`: Validates uploaded file types (PDF, Image).
* `notice_approval_serializer.py`: Validates `rejection_reason` is properly captured during a reject action.
* `notice_acknowledgement_serializer.py`: Minimal serializer for parsing user acknowledgements.

---

## ✅ Phase 2 — Service Layer (COMPLETED)
**Location:** `Backend/apt_proj/Apt_Notices/services/notice_service.py`
Focus: Core business rules. Views will remain entirely "dumb" and pass data directly here.

* `create_notice(data, user, attachments)`: Creates the draft and binds the files.
* `update_notice(notice, data, user)`: **Enforces the 15-minute rule.** Checks if `now() > notice.created_at + 15 mins`. If true, raises a Validation Error. Otherwise, updates fields.
* `publish_notice(notice, user)`: Validates audience is valid. If `publish_date <= now()`, sets status to `Published` (and triggers notification logic later in Phase 6). If future, sets status to `Scheduled`.
* `cancel_notice(notice, user)`: Transitions notice to `Cancelled`.
* `approve_notice(notice, user)` / `reject_notice(notice, user, reason)`: Modifies the notice status and records a `NoticeApproval` history log.
* `acknowledge_notice(notice, user)`: Queries the `NoticeAcknowledgement` for that user and marks it `Acknowledged`.

---

## ✅ Phase 3 — API Layer (Endpoints) (COMPLETED)
**Location:** `Backend/apt_proj/Apt_Notices/views/` & `urls.py`
Focus: Standard HTTP routing, request parsing, and delegating to the Service layer.

### Manager / Admin Endpoints
* `POST   /api/notices/`
* `GET    /api/notices/`
* `GET    /api/notices/<id>/`
* `PUT    /api/notices/<id>/`
* `DELETE /api/notices/<id>/`
* `POST   /api/notices/<id>/publish/`
* `POST   /api/notices/<id>/cancel/`

### Approval Endpoints
* `POST   /api/notices/<id>/approve/`
* `POST   /api/notices/<id>/reject/`

### Resident Endpoints
* `GET    /api/my-notices/` (Queries dynamic JSON targeting against the resident's profile)
* `POST   /api/notices/<id>/acknowledge/`

---

## ✅ Phase 4 — Scenario Testing (COMPLETED)
Focus: Run the 10 real-world scenarios through the created API/Service layers to guarantee target resolution dynamically works and the 15-minute lock functions seamlessly.

---

## ✅ Phase 5 — Celery Automation (COMPLETED)
Focus: Background periodic task processing.

* `publish_scheduled_notice`: Periodic task that finds `Scheduled` notices where `publish_date <= now()` and executes the publish flow.
* `send_ack_reminder`: Daily background job. Finds users with `Pending` acknowledgements, `reminder_count < 3`, and triggers the reminder logic.
* `expire_notice`: Periodic task that finds active notices past their `valid_until` date and transitions them to `Expired`.

---

## ✅ Phase 6 — FCM Push Notifications (COMPLETED)
Focus: Final delivery bridging.

* Integrates into the Service layer's `publish_notice()` and the Celery `send_ack_reminder` task.
* Resolves the JSON `target_audience` into raw User IDs using current apartment/role bindings, fetches Device Tokens, and dispatches to Firebase.

---

## ⏳ Phase 7 — Frontend Implementation (PENDING)
**Location:** `workspace_simple/Frontend/src/`
Focus: User Interfaces for creating, viewing, and acknowledging Notices.

* **Admin Notice Management UI**: Data table to list Notices, filter by status, and view acknowledgement metrics.
* **Notice Creation Wizard**: Form to input notice details, upload attachments, and dynamically build the `target_audience` JSON based on apartment hierarchy.
* **Resident Feed**: Integration into the Resident Dashboard to display active notices.
* **Acknowledgement UI**: Buttons for residents to acknowledge required notices.
* **Real-time Integration**: Connect to `/ws/notifications/` WebSocket to show live toasts/badges when a new Notice is published.
