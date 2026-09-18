# Supabase + Django Storage — Implementation Steps

This document outlines the phased implementation plan for migrating to the centralized Supabase storage architecture.

## ✅ Step 1 — Create Buckets
- Create `APP-DEV` bucket
- Create `APP-PROD` bucket
*(Completed: Both buckets created as private)*

## ✅ Step 2 — Configure Initial Storage Policies
- Configured broad `authenticated -> SELECT` and `authenticated -> INSERT` policies to get started.
*(Completed: No further policies needed until Step 11)*

## ✅ Step 3 — Django ↔ Supabase Configuration
- Add Supabase configuration to Django environment variables (`Backend/settings.py`).
- Implement environment isolation: We are using a single Supabase project with **separate buckets** (`APP-DEV` and `APP-PROD`) to isolate development and production data.
- Ensure secrets never reach frontend/mobile code.
*(Completed)*

## ✅ Step 4 — Build Generic StorageService
- Create a centralized `StorageService` in Django (`Backend/storage/services/storage_service.py`).
- Define storage-related exceptions.
- Implement Supabase admin client initialization (using `SUPABASE_SERVICE_KEY` for backend-driven operations).
*(Completed)*

## ✅ Step 5 — Media Database Model
- Define the generic media record before connecting it to specific domain models.
- The goal is one media system referencing objects, rather than distinct attachment tables per domain.

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

## ✅ Step 6 — Signed Upload Authorization
- Implement the upload authorization flow utilizing **Proof Tokens**:
```text
Client -> Django (auth/validate) -> Generate Signed Upload URL + Proof Token -> Supabase
```
- Django should not receive the entire file merely to forward it to Supabase. The generated `proof_token` guarantees to the backend that the client successfully uploaded an authorized file when submitting the final domain object.
*(Completed: Built `AuthorizedUploadView` and integrated Supabase Signed URLs)*

## ✅ Step 7 & 8 — Upload Progress & Frontend Component
- Built a reusable `MediaUpload.tsx` mechanism utilizing a `FileItem` subcomponent to cleanly handle concurrent background processing.
- Implemented **Client-Side Poster Extraction** (`media.utils.ts`) to natively generate `.thumb.webp` frames from videos.
- Bypassed TUS protocol because Signed URLs do not support TUS without direct Supabase Auth, opting for robust single-shot HTTP `PUT`s via Axios that track native upload progress.
*(Completed)*

## ➡️ Step 9 — Domain Integration (Generic Ownership)
- **✅ Phase 9.1 (Media Migration)**: Lock the final `Media` table design utilizing Django `GenericForeignKey` (`content_type`, `object_id`) and an explicit `UploadStatus` (`pending` -> `uploaded`). Split `StorageService` into `generate_upload_authorization` and `attach_media`. (Completed)
- **✅ Phase 9.2 (Domain Models)**: Update `Issue`, `Notice`, and `Bill` to use `GenericRelation('apt_proj.Media')` instead of distinct attachment models (like `IssueAttachment`). Update domain services to verify proof tokens and link the existing Media rows, keeping Supabase logic strictly decoupled from domain APIs. (Completed)

## ✅ Step 10 — Signed Download URLs (Completed)
- Built `MediaDownloadView` at `GET /storage/media/<id>/download/` to grant short-lived (1-hour) cryptographic access tokens for private media.
- Aligned with PrajaPulse architecture: Django only validates and hands off the Signed URL; all heavy video streaming happens directly from the Supabase Edge to the Client, bypassing Django memory entirely.

## ✅ Step 11 — Tighten Storage Policies (Completed)
- Extracted `has_perm` into a central `Apt_Common/utils.py` helper.
- Upgraded `MediaDownloadView` to act as a Dynamic Authorization Dispatcher.
- Enforced strict object-level access policies dynamically (verifying `created_by_id`, `assigned_to_id`, and `has_perm` checks) before issuing Signed URLs for private files.

## Step 12 — CDN
- Finalize CDN configuration, caching behavior, cache invalidation, and range-request behavior for large media playback.

---

## 🎯 Immediate Next Task
We have successfully completed **Step 10 (Signed Download URLs)**, enabling lightning-fast direct CDN streaming via secure cryptographic tokens!
The immediate next task is **Step 12 (CDN)**, where we will finalize the CDN configuration, caching behavior, cache invalidation, and range-request behavior for large media playback.

---

## 🏗️ Core Architectural Principles
*(Extracted from original architecture notes)*

1. **Environment Isolation**: We use a **single Supabase project** but maintain **separate buckets** (`APP-DEV` and `APP-PROD`) to isolate development data from production data while keeping infrastructure simple.
2. **Access Control (Pattern C)**: We do not expose storage credentials to the frontend. All private downloads and uploads are mediated by the Django backend, which authorizes the user and generates **short-lived Signed URLs**.
3. **Encryption**: We rely on **Provider-Managed Encryption** for data at rest. Application-level encryption is deemed unnecessary for our current threat model as it introduces significant complexity (disabling native CDN caching).
4. **Upload Thresholds**: Standard single-part HTTP PUTs via Signed URLs for files <10MB. Chunked/resumable (TUS) uploads are recommended for files >10MB to handle network interruptions.
