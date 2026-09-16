# End-to-End Codebase Audit Report

This document contains a complete architectural, performance, and UI/UX audit of the Jains Prakriti management system codebase.

---

## Stage 1 — Backend Audit

### 1. Performance

#### [Critical] — Massive N+1 Query Bottleneck on Issue List
**Location:** `Backend/apt_proj/Apt_Issues/views/issue_views.py` → `IssueAPIView.get_queryset`

**Problem**
The queryset `Issue.objects.all().order_by('-created_at')` is missing relationship prefetching.

**Why it matters**
The `IssueSerializer` accesses several foreign relationships: `created_by`, `assigned_to`, `category`, and critically, it checks `hasattr(obj, 'timeline_record')` (a reverse OneToOne field) and loops over `attachments` (a reverse ForeignKey). Without prefetching, Django evaluates these relationships lazily.

**Impact**
For a list of 50 issues, Django will execute 1 query to get the issues, and up to 5 additional queries per issue to fetch the related data. This means up to 251 database queries per API call. This will cause severe latency and DB thread starvation at scale.

**Solution**
Update the queryset to explicitly prefetch all required boundaries:
```python
Issue.objects.select_related(
    'category', 'created_by', 'assigned_to', 'timeline_record'
).prefetch_related('attachments').order_by('-created_at')
```

### 2. Database Read/Write Audit

#### [Critical] — Database `.exists()` Inside Serializer Loop
**Location:** `Backend/apt_proj/Apt_Notices/serializers/notice_serializer.py` → `NoticeSerializer.get_user_has_acknowledged`

**Problem**
Inside the serializer, the `get_user_has_acknowledged` method runs `obj.acknowledgements.filter(user=request.user, status='Acknowledged').exists()`.

**Current DB behavior**
The Python serializer loop pauses for every single `Notice` row, sends an `EXISTS` SQL query to the database, waits for the response, and then continues. (Database → Python → processing → Database).

**Why it is inefficient**
Serializer method fields execute synchronously per row.

**Impact**
If there are 20 notices, this triggers 20 separate DB roundtrips. As the community board grows, this endpoint will grind to a halt.

**Solution**
Push this logic down to the SQL layer. In `NoticeListCreateAPIView.get()`, annotate the queryset using a subquery:
```python
from django.db.models import Exists, OuterRef
has_acked = NoticeAcknowledgement.objects.filter(notice=OuterRef('pk'), user=request.user, status='Acknowledged')
Notice.objects.annotate(user_has_acknowledged=Exists(has_acked))
```
Then, update the serializer to simply read the boolean directly from the object without querying.

#### [Low] — Unaggregated Count Queries for Stats
**Location:** `Backend/apt_proj/Apt_Accounts/views/user_views.py` → `UserAPIView.get`

**Problem**
The pagination stats dictionary executes 4 separate `.count()` queries on the `User` and `UserProfile` tables sequentially.

**Current DB behavior**
Django executes 4 `SELECT COUNT(*)` queries one after another.

**Why it is inefficient**
It incurs 4 network roundtrips to the DB when it could potentially be resolved in fewer trips or aggregated.

**Impact**
Low impact currently, but adds minor latency to the initial user list load.

**Solution**
Acceptable at current scale, but can be optimized using Django's `aggregate()` with `Count(filter=Q(...))` to run in a single pass over the table.

### 3. Backend Robustness

#### [Medium] — Fragile Metadata Unpacking
**Location:** `Backend/apt_proj/Apt_Issues/serializers/issue_serializers.py` → `IssueSerializer.to_representation`

**Problem**
The serializer manually loops through the `issue_metadata` JSON dictionary and injects every key directly into the root `ret` dictionary.

**Why it matters**
If a metadata payload happens to contain a key that matches a core model field (like `id`, `title`, or `status`), the metadata value will silently overwrite the actual database value in the API response.

**Solution**
Stop unpacking dynamic JSON keys into the root dictionary. Pass `issue_metadata` to the frontend exactly as it is, and allow the React frontend to destructure or access `row.issue_metadata.flat_number` safely.

---

## Stage 2 — Frontend Audit

### 1. React Performance

#### [High] — Unmemoized Columns Array Triggering Cascading Renders
**Location:** `Frontend/src/pages/Dashboard/tabs/Helpdesk/RequestsPage.tsx` → `columns` definition

**Problem**
The `columns` array (which contains complex render functions and JSX) is defined directly in the body of the `RequestsPage` functional component.

**Why it happens**
Because it is not wrapped in `useMemo`, every time the `RequestsPage` state changes (e.g., when `isModalOpen` toggles or `selectedRequest` changes), the `columns` array is recreated in memory. The heavy `<DataTable>` child component sees a new array reference and re-renders entirely.

**Performance impact**
Typing in modals or clicking rows will feel sluggish because the entire paginated table is re-rendering in the background unnecessarily.

**Solution**
Wrap the configuration in `useMemo`:
```typescript
const columns = useMemo(() => [ ... ], []);
```

#### [Low] — Flawed Event Listener Dependencies
**Location:** `Frontend/src/pages/Dashboard/tabs/Helpdesk/RequestsPage.tsx` → `useEffect` (line 31)

**Problem**
The `useEffect` that listens for `ISSUES_UPDATED` window events includes `selectedRequest` in its dependency array.

**Why it happens**
The developer wanted access to the latest `selectedRequest` inside the event handler. However, placing it in the dependency array means the event listener is detached and reattached every single time the user clicks a row.

**Performance impact**
Minor churn, but represents an unstable object reference pattern.

**Solution**
Store the selected request in a mutable ref (`const selectedRef = useRef(selectedRequest)`) and update it during render. Remove `selectedRequest` from the `useEffect` dependency array so the listener is only bound once on mount.

### 2. Frontend Robustness & Clean UI / UX

#### [Medium] — Hardcoded and Duplicated UI States
**Location:** `Frontend/src/pages/Dashboard/tabs/Helpdesk/RequestsPage.tsx` → `renderCard`

**Problem**
The logic for determining which tailwind classes to apply to specific Helpdesk Statuses (e.g., Open = Blue, Resolved = Green) is hardcoded into a long ternary operator inside `renderCard`.

**Why it is problematic**
This logic is visually noisy and duplicated. If the design system is updated, or if an `Acknowledged` status needs a purple badge, developers have to hunt down multiple files (the DataTable configuration, the Mobile Card view, and the Request Details Panel) to update the colors.

**Recommended solution**
Extract a clean, centralized `<StatusBadge status={row.status} />` UI component that internally maps statuses to Tailwind classes. Reuse this single component across all views.

---

## Stage 3 — Storage & Media Architecture Audit

### 1. Environment Storage Isolation

The application now follows a two-environment storage model:

```text
DEV
 ├── DEV Django backend
 ├── DEV database
 └── APP-DEV Supabase Storage bucket

PROD
 ├── PROD Django backend
 ├── PROD database
 └── APP-PROD Supabase Storage bucket
```

This keeps development media isolated from production media.

The application should never allow a DEV backend to write to `APP-PROD`, or a PROD backend to write to `APP-DEV`.

Environment-specific Supabase credentials must therefore be configured independently.

---

### 2. [High] — Current Storage Policies Are Too Broad

**Location:** Supabase Storage → Policies

**Current configuration**

Both buckets currently have policies equivalent to:

```text
APP-DEV
 ├── authenticated users → SELECT
 └── authenticated users → INSERT

APP-PROD
 ├── authenticated users → SELECT
 └── authenticated users → INSERT
```

This means any authenticated Supabase user can potentially read from and upload to the bucket, subject to the bucket's other restrictions.

**Why it matters**

Authentication only establishes that the user is logged in.

It does not establish that the user is authorized to access a particular object's contents.

For example:

```text
Resident A
    ↓
authenticated
    ↓
could potentially access
Resident B's private media
```

That is not sufficient for the final production authorization model.

**Recommended direction**

Keep the buckets private and move toward object-level authorization based on the application's ownership/access rules.

Django should remain responsible for determining whether the requesting user is allowed to access the associated Issue, Bill, Notice, or other resource.

The current broad policies can be used during initial development, but they should not be treated as the final production authorization model.

---

### 3. Shared Storage Service

Media handling should not be implemented independently inside every Django module.

Instead, introduce a reusable storage abstraction:

```text
                    StorageService
                         │
        ┌────────────────┼────────────────┐
        │                │                │
     Issues            Bills           Notices
        │                │                │
        └────────────────┼────────────────┘
                         │
                  Supabase Storage
```

The storage service should encapsulate:

* upload initialization
* signed upload URL generation
* resumable/chunked upload support
* upload completion
* object path generation
* MIME/type validation
* file-size validation
* signed download URL generation
* object deletion
* environment-to-bucket mapping

This prevents every application module from implementing its own storage logic.

---

### 4. Upload Architecture

The application should not send large media files through Django unnecessarily.

Recommended flow:

```text
Frontend / Mobile
       │
       │ request upload authorization
       ▼
     Django
       │
       │ authorize + create upload information
       ▼
Supabase Storage
       ▲
       │
       │ direct upload
       │
Frontend / Mobile
```

Django handles authorization and metadata.

The client uploads the actual file directly to Supabase Storage.

This avoids:

```text
Client
  ↓
Django
  ↓
Supabase
```

for every byte of a potentially large file.

Instead:

```text
Client ───────────────→ Supabase
   │
   └──── authorization → Django
```

---

### 5. Resumable / Chunked Uploads

Large files should support resumable uploads.

Conceptually:

```text
Original file
      │
      ├── Part 1
      ├── Part 2
      ├── Part 3
      ├── Part 4
      └── Part 5
             │
             ▼
       Storage service
             │
             ▼
       Final object
```

The application should treat the final assembled object as the actual media asset.

The database should not store individual chunk references as the permanent media representation.

Instead:

```text
Upload process
     ↓
Chunks / resumable parts
     ↓
Final object
     ↓
Object path
     ↓
Django media record
```

Chunking should be used where file size and network reliability justify it. It should not be assumed that every small image requires a complicated chunking workflow.

---

### 6. Upload Progress

The frontend/mobile application should expose upload progress to the user.

For example:

```text
photo.jpg

████████████████████ 100% ✓
```

For multiple files:

```text
Attachments

image.jpg       100% ✓
video.mp4        73%
document.pdf    100% ✓
```

The Submit action should remain disabled until all required uploads have completed successfully.

Recommended flow:

```text
Select media
     ↓
Upload begins
     ↓
Show progress
     ↓
All uploads complete
     ↓
Enable Submit
     ↓
POST Issue/Bill/Notice
```

This keeps the final application API request deterministic: referenced media already exists before the domain object is submitted.

---

### 7. Media Metadata

Django should store a reference to the final storage object rather than permanently storing temporary signed URLs.

Conceptually:

```text
Issue
 └── Media
      ├── object_path
      ├── original_filename
      ├── mime_type
      ├── file_size
      └── uploaded_at
```

For example:

```text
issues/123/550e8400-e29b-41d4-a716-446655440000.jpg
```

The object path is stable.

A signed access URL can be generated when the media needs to be returned to an authorized client.

---

### 8. Signed URLs

Private media should not be exposed through permanent public URLs.

Recommended access pattern:

```text
Client
   │
   │ request Issue
   ▼
Django
   │
   │ authorize user
   │
   │ generate signed media URL
   ▼
Client
   │
   │ temporary signed URL
   ▼
Supabase Storage / CDN
```

Signed URLs should have an appropriate expiration period.

The signed URL itself should not be treated as the authorization mechanism for the application's domain object. Django must first determine whether the user is allowed to access the associated resource.

---

### 9. Encryption and Storage Security

The following concerns must remain separate:

```text
Encryption at rest
Encryption in transit
Authorization
Signed URLs
CDN caching
Application-level encryption
```

HTTPS protects data in transit.

Supabase/provider-managed storage encryption protects stored objects at rest.

Signed URLs provide temporary access to private objects.

Authorization determines whether the application user should receive access in the first place.

These mechanisms solve different problems and should not be treated as interchangeable.

Application-level encryption should only be introduced for data requiring protection beyond the normal storage-provider security model.

---

### 10. MIME Type and File Size Restrictions

The initial buckets have file restrictions configured.

Current allowed MIME types include:

```text
image/jpeg
image/png
image/webp
video/mp4
application/pdf
```

The current file-size restriction is:

```text
10 MB
```

with a project-level maximum of 50 MB.

These restrictions provide an initial safeguard against unsupported file types and unnecessarily large uploads.

However, the final limits should be defined according to actual application requirements.

For example:

```text
Images  → potentially smaller limit
Documents → potentially moderate limit
Videos → potentially larger limit
```

The same universal upload mechanism can support different limits per resource type without duplicating the upload infrastructure.

---

### 11. Module-Level Storage Independence

Issues, Bills, Notices, and future modules should not implement their own upload mechanisms.

Instead:

```text
IssueService
BillService
NoticeService
      │
      ▼
 StorageService
      │
      ▼
Supabase Storage
```

Each module should provide the storage service with contextual information such as:

```text
resource_type
resource_id
filename
mime_type
size
```

The storage service then generates the appropriate object path and upload workflow.

This maintains a single implementation for storage behavior across the application.

---

## Stage 3 — Recommended Storage Flow

The overall architecture should follow:

```text
                  ┌──────────────────┐
                  │ Frontend / Mobile│
                  └────────┬─────────┘
                           │
                  Request upload
                           │
                           ▼
                  ┌──────────────────┐
                  │      Django      │
                  │  Authorization   │
                  │ StorageService   │
                  └────────┬─────────┘
                           │
                  signed upload
                           │
                           ▼
                  ┌──────────────────┐
                  │ Supabase Storage │
                  │                  │
                  │ resumable upload │
                  │       ↓          │
                  │   final object   │
                  └────────┬─────────┘
                           │
                     object path
                           │
                           ▼
                  ┌──────────────────┐
                  │ Django Media DB  │
                  └──────────────────┘
```

For retrieval:

```text
Client
  ↓
Django API
  ↓
Authorization
  ↓
Generate signed URL
  ↓
Client receives media URL
  ↓
Supabase Storage / CDN
```

---

## Storage Architecture Status

### Implemented / Configured

* Separate `APP-DEV` and `APP-PROD` buckets
* Private buckets
* File-size restriction
* MIME-type restriction
* Authenticated-user development policies
* Authenticated-user production policies

### Architecture Decisions

* Django remains the application's authorization layer.
* Media bytes should be uploaded directly to Supabase rather than proxied through Django.
* A shared `StorageService` should handle all modules.
* Large uploads should support resumable/chunked uploads.
* Upload progress should be exposed to the client.
* The final assembled object is the permanent media asset.
* Django stores object references/metadata rather than temporary signed URLs.
* Signed URLs should be generated for authorized media access.
* DEV and PROD use independent storage buckets and credentials.

### Still To Be Implemented

* Django `StorageService`
* Signed upload flow
* Resumable/chunked upload flow
* Upload completion handling
* Media metadata model
* Signed download URL generation
* Resource-level authorization policies
* Object deletion lifecycle
* CDN configuration where required

---

## Codebase-Wide Analysis

### Major Drawbacks
The most significant architectural flaw across the codebase is the **N+1 serialization pattern in the Django backend**. Relying on `SerializerMethodField` to traverse relationships (like timelines) or perform logic (like `.exists()`) causes exponential query growth. Django developers frequently fall into this trap because DRF abstracts away the looping nature of list serialization.

### Inefficiencies
The frontend is heavily reliant on top-level component re-renders. In components like `RequestsPage`, state changes that only affect a modal (e.g., `isModalOpen`) force the entire DOM tree, including the heavy `DataTable`, to re-evaluate. The lack of basic React memoization (`useMemo` for props like `columns` or `filters`) is the primary driver of client-side inefficiency.

### Redundancies
There is significant redundancy in how UI states are handled. Status colors, badge designs, and timestamp formatting logic are scattered across component files rather than being centralized in the `src/components/ui` folder.

### Scalability Concerns
As the system scales from 100 to 10,000 users, the **Community Notice Board** and **Helpdesk Timeline** are the most vulnerable breaking points:
1. **Notice Board:** The synchronous `.exists()` query per notice will lock up backend threads as the notice board grows.
2. **Helpdesk:** Fetching `IssueTimeline` via the reverse `timeline_record` OneToOne relation without prefetching means every single ticket rendered on the dashboard hits the database individually. 
At scale, these two issues alone will bring the API to a halt unless explicitly optimized with `select_related`, `prefetch_related`, and SQL Subqueries.
