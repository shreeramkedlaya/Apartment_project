# Supabase + Django Storage — Implementation Steps

This document outlines the phased implementation plan for migrating to the centralized Supabase storage architecture, incorporating advanced upload and proxy patterns.

## Phase 1 — Finalize the architecture
- Define the complete upload lifecycle
- Define the download/access lifecycle
- Define DEV → APP-DEV mapping
- Define PROD → APP-PROD mapping
- Define object/path naming convention
- Define what metadata Django stores
- Define which files are public vs private
- Define file-size and MIME-type rules

## Phase 2 — Django storage foundation
- Create a centralized `StorageService`
- Add Supabase configuration to Django environment variables
- Separate DEV and PROD credentials/configuration
- Implement Supabase client initialization
- Ensure secrets never reach frontend/mobile code
- Define storage-related exceptions

*Concept:*
```text
Backend/
└── storage/
    ├── services/
    │   └── storage_service.py
    ├── exceptions.py
    └── ...
```

## Phase 3 — Media database model

Define the generic media record before connecting it to Issues/Bills/Notices.

*Concept:*
```text
Media
├── id
├── object_path
├── original_filename
├── mime_type
├── file_size
├── bucket/environment
├── uploaded_at
└── ...
```

Then decide how resources reference it:
```text
Issue ──> Media
Bill ──> Media
Notice ──> Media
```
*The goal is one media system, not `IssueAttachment`, `BillAttachment`, `NoticeAttachment` with three separate upload implementations.*

## Phase 4 — Upload authorization

Implement the upload authorization flow utilizing **Proof Tokens**:
```text
Client
   │
   │ "I want to upload this file"
   ▼
Django
   │
   ├── authenticate
   ├── authorize
   ├── validate MIME
   ├── validate size
   └── generate upload information (upload URL + proof_token)
            │
            ▼
       Supabase Storage
```
*Django should not receive the entire file merely to forward it to Supabase. The generated `proof_token` guarantees to the backend that the client successfully uploaded an authorized file when submitting the final domain object (e.g. Issue, Bill).*

## Phase 5 — Resumable/chunked upload

- **Implement Supabase TUS Resumable Protocol**: Leverage Supabase's native TUS protocol support (via `tus-js-client`) for robust chunked uploads for files >6MB.
- **Single-Shot Fallback**: For smaller files (<6MB), allow standard single-part HTTP PUTs directly to the presigned upload URL for maximum speed.
- Define chunk/part lifecycle and upload session
- Define retry and interrupted-upload behavior
- Ensure chunks result in one final object
- Return the final `object_path`

*Concept:*
```text
file.mp4 (>6MB)
   │
   ├── chunk 1 ──✓ (via TUS Protocol)
   ├── chunk 2 ──✓
   ├── chunk 3 ──✓
   └── chunk 4 ──✓
             │
             ▼
        final object
             │
             ▼
issues/123/abc.mp4
```

## Phase 6 — Frontend/Mobile upload component

Build one reusable upload mechanism. It should provide:
- **Client-Side Poster Extraction**: For videos, generate a local thumbnail frame (`.thumb.webp`) and request a separate presigned URL to upload it as a sibling object. This avoids heavy backend video processing.
- `upload(file)` (with TUS vs Single-Shot routing)
- `uploadMultiple(files)`
- `progress`
- `status`
- `error` / `retry` / `cancel`

Then `Issue`, `Bill`, `Notice`, etc. all consume the same mechanism.

## Phase 7 — Domain integration

Only after the generic storage system works, update domain models to accept proof tokens:
```text
Issue ──> proof_tokens ──> media_ids
Bill ──> proof_tokens ──> media_ids
Notice ──> proof_tokens ──> media_ids
```
*The domain APIs should not know how Supabase uploads actually work.*

## Phase 8 — Signed download URLs & Proxy Streaming

Implement the secure download flows:

**Option A: Backend Proxy Streaming (Highly Sensitive Data)**
```text
GET Issue Attachment (High Security)
     ↓
Django
     ↓
authorize user
     ↓
StorageService (Fetch using Service Key)
     ↓
Stream raw bytes to Client (via StreamingHttpResponse)
```
*This completely hides the storage URL from the client but uses backend bandwidth.*

**Option B: Temporary Signed URLs (General Private Data)**
```text
GET Issue
     ↓
Django
     ↓
authorize user
     ↓
StorageService
     ↓
generate temporary signed URL
     ↓
API response
```
*The database stores the stable object path, not that temporary URL.*

## Phase 9 — Storage policies

Once the application flow is working:
- Review current broad `authenticated → SELECT`
- Review current broad `authenticated → INSERT`
- Design object-level access policies
- Ensure users cannot access unrelated private media
- Ensure DEV cannot access PROD storage
- Ensure PROD credentials cannot write to DEV

## Phase 10 — CDN

Only after storage + authorization are working:
```text
Private object
     ↓
authorization
     ↓
signed URL
     ↓
CDN
     ↓
Supabase Storage
```
Then handle CDN configuration, cache behavior, signed URLs, expiration, private media, and large-file/range-request behavior.

---

## 🎯 Starting Point (Next Session)

**Do not start with chunked upload code.**

Start with these three things:
1. `StorageService` architecture
2. Media database model
3. Supabase ↔ Django configuration

Once those are solid, we implement the upload protocol.

### Progression Roadmap
```text
Architecture
    ↓
StorageService
    ↓
Media Model
    ↓
Supabase Configuration
    ↓
Signed Upload (Single-Shot & Proof Tokens)
    ↓
Resumable/Chunked Upload (TUS Protocol)
    ↓
Client-Side Poster Extraction & Progress
    ↓
Issue/Bill/Notice integration
    ↓
Signed Download & Proxy Streaming
    ↓
Authorization Policies
    ↓
CDN
```
