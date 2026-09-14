# Backend Architecture & Structure Reference

This document provides a reference of the Django backend architecture, directory layout, model distribution, and architectural rules for `Backend/`.

---

## 1. Domain-Driven Directory Layout

All backend business logic is sorted strictly into domain feature packages under `Backend/apt_proj/`:

```text
Backend/
├── apt_proj/
│   ├── Apt_Accounts/          # Authentication, Users, Roles, Blocks, Flats
│   │   ├── Accounts_models.py
│   │   ├── serializers/
│   │   ├── services/
│   │   └── views/
│   ├── Apt_Issues/            # Issue Tracking & Ticketing
│   │   ├── Issue_models.py
│   │   ├── serializers/
│   │   ├── services/
│   │   └── views/
│   ├── Apt_Notices/           # Community Notice Board & Targeted Broadcasts
│   │   ├── Notices_models.py
│   │   ├── serializers/
│   │   ├── services/
│   │   └── views/
│   ├── Apt_Notifications/     # FCM Push Notifications, Daphne WebSockets & Celery Tasks
│   │   ├── consumers.py
│   │   ├── models.py          # DeviceToken model
│   │   ├── routing.py
│   │   └── tasks.py
│   ├── Apt_Dashboard/         # Aggregated KPI & summary views
│   ├── Apt_Settings/          # Application-level settings & version API
│   ├── Apt_Common/            # Global renderers, custom exception handlers, helpers
│   ├── models.py              # Central aggregator for migrations
│   └── urls.py                # Main URL router
├── celery_app.py              # Celery worker & beat configuration
├── manage.py
└── settings.py                # Flat Django configuration driven by .env
```

---

## 2. Models & Schema Organization

All models reside within their respective domain folders:

| Feature Domain | Models Defined | DB Table Name | Purpose |
|---|---|---|---|
| **Apt_Accounts** | `Block`, `Flat`, `Role`, `UserProfile` | `"apt_data"."apt_proj_*"` | User management, RBAC, apartment hierarchies |
| **Apt_Issues** | `IssueCategory`, `Issue`, `IssueTimeline`, `IssueAttachment` | `"apt_data"."apt_proj_*"` | Maintenance ticketing, hybrid JSON timeline tracking |
| **Apt_Notices** | `Notice`, `NoticeAttachment`, `NoticeApproval`, `NoticeAcknowledgement` | `"apt_data"."apt_proj_*"` | Community announcements, dynamic targeting, acknowledgements |
| **Apt_Notifications** | `DeviceToken` | `"apt_data"."apt_proj_devicetoken"` | Push notification tokens, platform registry |

### Aggregation in `apt_proj/models.py`
To ensure clean migrations, `apt_proj/models.py` imports and re-exports all domain models (`__all__`), pointing all database tables to the `"apt_data"` PostgreSQL schema.

---

## 3. Strict Backend Architectural Rules

1. **DRY `get_object` Pattern:**
   Never use `get_object_or_404` directly inside HTTP method handlers. Every `APIView` defines a helper `def get_object(self, pk):` to keep exception handling explicit.
2. **Explicit APIViews Only:**
   No `ModelViewSet` or generic magic DRF views. All endpoints use basic `APIView` with explicit `get`, `post`, `put`, `patch`, `delete`.
3. **Unified JSON Timelines:**
   Use the hybrid JSON pattern (`timeline.history.append(event)`) for audit trails and timeline events instead of separate relational log tables.
4. **Service Layer Separation:**
   Views remain "dumb" — HTTP parsing and permissions happen in views, while business rules live in `services/`.
