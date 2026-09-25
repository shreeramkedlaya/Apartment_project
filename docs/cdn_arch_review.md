# CDN Architecture Review
> **Purpose**: General industry reference for CDN patterns, private/public content delivery, signed URLs, authorization, caching, and upload/download flows.
> **Not application-specific.** No assumptions about any particular project are made here.
> **Last Updated**: 2026-09-25

---

## Important Distinction: Five Separate Concerns

The following are distinct and must not be conflated:

| Concern | What it is |
|---|---|
| **CDN Caching** | Storing a copy of a response at an edge node closer to the user |
| **Storage Encryption** | AES-256 encryption of objects at rest in S3/GCS/Azure Blob |
| **Transport Encryption** | TLS between browser, CDN edge, and origin |
| **Application-Level Encryption** | Encrypting data in application code before storage |
| **Authorization** | Verifying that a requesting user is permitted to access a resource |

Authorization failure is not solved by encryption. Encryption failure is not solved by authorization. Each requires its own correct implementation.

---

## Table of Contents
1. [CDN Fundamentals](#1-cdn-fundamentals)
2. [Public vs Private Content](#2-public-vs-private-content)
3. [Signed URLs](#3-signed-urls)
4. [Authorization Patterns](#4-authorization-patterns)
5. [Caching](#5-caching)
6. [Cache Invalidation](#6-cache-invalidation)
7. [Object Storage Integration](#7-object-storage-integration)
8. [Upload Flow](#8-upload-flow)
9. [Download Flow](#9-download-flow)
10. [Large File Handling and Range Requests](#10-large-file-handling-and-range-requests)
11. [Environment Separation](#11-environment-separation)
12. [Security Considerations](#12-security-considerations)
13. [Recommended CDN Baseline](#13-recommended-cdn-baseline)

---

## 1. CDN Fundamentals

A CDN (Content Delivery Network) is a distributed network of edge servers that cache content close to end users, reducing latency and origin load.

**How it works**:
1. User requests a resource from an edge node geographically near them.
2. If the edge has a cached copy (cache hit), it serves it directly.
3. If not (cache miss), the edge fetches it from the origin (object storage or application server), serves it, and optionally caches it.

**What a CDN does NOT do**:
- It does not add encryption to content that is not already encrypted.
- It does not add authorization to content that has no access control.
- A public object on a CDN is public. A private object on a CDN is only private if access control is implemented at the authorization layer.

---

## 2. Public vs Private Content

### Public Content
```
Browser → CDN Edge → Object Storage
```

Appropriate for: marketing images, CSS/JS bundles, fonts, public documentation, open datasets.

- Objects are publicly readable by anyone with the URL.
- CDN caches aggressively. Cache-Control headers drive TTL.
- No authorization check needed or performed.
- **Do not use for user-generated content, PII, or business-sensitive data.**

### Private Content

There are two documented patterns for serving private objects:

#### Pattern A: Backend Proxy
```
Browser → Authenticated Backend → Object Storage
```

- The backend handles authentication and authorization, then fetches the object from private storage and proxies it to the browser.
- **Advantage**: Full control over access checks; the browser never gets a direct URL to the storage object.
- **Disadvantage**: Every file download consumes application server bandwidth and memory. Not scalable for large files or high traffic. Django/Node/etc. were not designed to be file servers.

#### Pattern B: Backend Authorization → Signed URL → Direct CDN/Storage
```
Browser → Backend (auth check) → Signed URL → Browser → CDN/Storage directly
```

- The backend authenticates the user, verifies they are permitted to access the file, generates a short-lived signed URL, and returns it to the browser.
- The browser then downloads the file directly from storage (or a CDN fronting storage) using the signed URL.
- **Advantage**: Application server is not in the data path for the actual file transfer. Far more scalable. Offloads bandwidth to the CDN/storage edge.
- **Disadvantage**: The signed URL, once issued, is valid until it expires regardless of subsequent user revocation (see caveats below).

> **Industry Fact**: Pattern B (backend auth + signed URL + direct storage) is the documented recommended approach by AWS, GCP, and Supabase for serving private objects at scale. It is described in AWS's own documentation for S3 presigned URLs and CloudFront signed URLs.

---

## 3. Signed URLs

### What a Signed URL Is

A signed URL is a URL that embeds cryptographic authorization credentials in the query string. It grants time-limited access to a specific resource without requiring the requester to have any storage credentials of their own.

**Structure (S3 example)**:
```
https://bucket.s3.amazonaws.com/path/to/object
  ?X-Amz-Algorithm=AWS4-HMAC-SHA256
  &X-Amz-Credential=...
  &X-Amz-Date=...
  &X-Amz-Expires=3600
  &X-Amz-Signature=...
```

> **Industry Fact**: The entity generating the signed URL must itself have the necessary IAM permissions (e.g., `s3:GetObject`) for the object. A presigned URL cannot grant permissions the generating entity does not have.
> Source: https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html

### Key Properties

- **Time-bound**: The URL becomes invalid after the expiration period (`X-Amz-Expires`).
- **Object-scoped**: Access is limited to the specific bucket, object key, and HTTP method defined during generation.
- **Delegated but not elevated**: The URL holder gets exactly the permission embedded — no more.
- **Stateless**: The storage service validates the signature without contacting your backend.

### What a Signed URL Does NOT Do

- It does not check whether the user's account is still active or has had their access revoked since the URL was generated.
- It does not encrypt the content — the content is served in plaintext (over TLS) to anyone who has the URL.
- Hiding a URL is not an access control mechanism. If a signed URL is leaked, it is valid until it expires.

> **Industry Fact (OWASP)**: "Security through obscurity" — relying on the difficulty of guessing a URL rather than enforcing access control — is not a security mechanism.

### Signed URL Best Practices

- Keep TTLs short (5–60 minutes for downloads, 5–15 minutes for uploads).
- Do not store signed URLs in databases or logs — generate them on-demand.
- Always perform your application-level authorization check before calling the SDK to generate a URL.
- Use IAM roles rather than hardcoded credentials for the signing entity.

---

## 4. Authorization Patterns

### Simple Signed URL (No CDN)
```
Browser → Backend (auth) → S3 Presigned URL → Browser → S3 directly
```
- Backend verifies the user is allowed to access the file.
- Backend calls AWS SDK to generate presigned URL with short TTL.
- Browser downloads directly from S3.
- Works well for low-to-moderate traffic.

### CDN with Signed Cookies / Signed URLs (Cloudfront etc.)
```
Browser → Backend (auth) → CloudFront Signed URL/Cookie → Browser → CloudFront edge → S3
```
- CloudFront validates the signature at the CDN edge before serving the content.
- Allows the CDN to cache content for authorized users without the backend being in the request path.
- Signed cookies are useful when serving many private files (e.g., HLS video segments) without embedding a separate token in every URL.

> **Industry Fact**: Cloudflare offers Cloudflare Workers as a recommended approach to validate HMAC tokens at the edge for private content, allowing the CDN to both authorize and cache private content correctly.

### Caching Challenge with Private Content

Private objects with user-specific signed tokens create a cache-key challenge:
- If the CDN includes the token in the cache key, every user gets a unique URL → 0% cache hit rate.
- If the CDN strips the token from the cache key, it may serve cached authorized content to unauthorized users.

**Resolution (when caching private content via CDN)**:
- Only cache content that is identical for all authorized users (not user-specific content).
- Use CDN-level token validation (CloudFront Signed URLs, Cloudflare Workers) where the CDN validates auth before serving from cache.
- For truly per-user content, bypass the CDN cache or accept 0% cache hit rate on that resource.

---

## 5. Caching

### Cache-Control Headers

The primary mechanism for controlling CDN behavior.

| Header Value | Effect |
|---|---|
| `public, max-age=86400` | Cache for 24 hours at CDN and browser |
| `private, max-age=3600` | Cache only in browser (not CDN), 1 hour |
| `no-store` | Never cache anywhere |
| `no-cache` | Must revalidate with origin before serving from cache |
| `immutable` | Content will never change; aggressive caching acceptable |

> **Industry Fact**: CDNs respect `Cache-Control` headers from the origin by default. Cloudflare, CloudFront, and Fastly all document this behavior. You can override origin headers with CDN-level cache rules if needed.

### What Should Be Cached

| Content Type | CDN Caching Strategy |
|---|---|
| Static JS/CSS bundles (with hash in filename) | `public, max-age=31536000, immutable` |
| Static images, fonts | `public, max-age=86400` to `31536000` |
| Public HTML pages | `public, max-age=300` or shorter |
| Private user files (via signed URL) | Do not cache, or use CDN-level auth |
| API responses | Generally do not cache; use Redis/backend cache |

---

## 6. Cache Invalidation

> **Industry Fact**: CDN cache invalidation (purging a cached object) is a supported feature of all major CDN providers (CloudFront, Cloudflare, Fastly) but incurs latency — invalidation propagates across edge nodes and may take seconds to minutes.

**Common strategies**:
- **Filename-based invalidation**: Include a content hash in the filename (e.g., `app.a3f2b1.js`). When content changes, the filename changes, and the CDN automatically fetches the new version. No explicit invalidation needed. This is the recommended approach for static assets.
- **Explicit invalidation API**: Call the CDN's invalidation API when content changes. Suitable for HTML pages or content where filenames cannot change.
- **Short TTLs**: For frequently changing content, use a low `max-age`. Accept the trade-off of more origin requests.

---

## 7. Object Storage Integration

CDNs typically sit in front of object storage (S3, GCS, Azure Blob, Supabase Storage) as follows:

```
Browser → CDN Edge → Object Storage (Origin)
```

- The CDN acts as a caching reverse proxy for the storage bucket.
- The storage bucket is kept **private**. The CDN is the only authorized accessor (via Origin Access Control / OAC in CloudFront, or equivalent).
- Browsers never receive a direct storage URL — only CDN URLs.

**Benefit**: The storage bucket is not exposed to the public internet. The CDN provides:
- DDoS protection
- Geographic distribution and reduced latency
- SSL termination
- Caching

---

## 8. Upload Flow

### Recommended Production Upload Flow (Direct-to-Storage)

```
1. User selects file(s) in browser
2. Browser sends a signed upload request to backend:
   POST /api/uploads/request
   { filename, content_type, file_size }

3. Backend:
   a. Authenticates and authorizes the user
   b. Generates a presigned PUT URL (or multipart upload initiation)
   c. Returns the presigned URL to the browser
      { upload_url, object_key, expires_in }

4. Browser uploads the file directly to storage:
   PUT {upload_url}
   Content-Type: image/jpeg
   [file bytes]

5. Browser notifies backend of completion:
   POST /api/uploads/confirm
   { object_key }

6. Backend validates upload (optional checksum check, file type validation)
   and records the media reference in the database
```

> **Architecture Recommendation**: The application server (Django, Node, etc.) must not be in the data path for the actual file transfer. Proxying large files through the application server consumes memory, limits concurrency, and is unnecessary given presigned URL patterns.

### Upload Progress

Browsers natively support `XMLHttpRequest.upload.onprogress` and `fetch` with readable streams for upload progress. No special server-side implementation is required for progress tracking on direct-to-storage uploads.

---

## 9. Download Flow

### Simple Download (Most Common Case)
```
1. User requests a private file
2. Browser → Backend: GET /api/files/{id}
3. Backend: verifies user is authorized to access the file
4. Backend: generates a presigned GET URL (TTL: 15-60 min)
5. Backend: returns the presigned URL
6. Browser: fetches the file directly from storage/CDN using the URL
```

### Public Asset Download
```
Browser → CDN Edge (serves from cache or fetches from origin)
```
No backend in the path. Cache-Control headers drive TTL.

---

## 10. Large File Handling and Range Requests

### HTTP Range Requests

> **Industry Fact**: HTTP Range Requests (RFC 9110) are a standard protocol feature allowing clients to request a byte range of a resource. S3, GCS, and Azure Blob Storage all support this natively. Browsers use this automatically for:
> - Video/audio seeking (requesting only the bytes for the current playback timestamp)
> - Resumable downloads (resuming from the last received byte after a connection drop)

**This is a protocol-level feature. No application code is needed.** S3 responds with HTTP 206 Partial Content automatically. CDNs support and optimize for this (slice-based caching).

### Application-Level Chunking

Splitting a large file into distinct stored sub-files. Used for:
- HLS/DASH streaming video (`.ts` / `.m4s` segments)
- Large-scale data processing pipelines

> **Architecture Decision**: Application-level chunking is NOT required for ordinary web applications delivering documents, images, or typical user-uploaded files. Conflating it with HTTP Range Requests is a common architectural error.

---

## 11. Environment Separation

CDN configuration should also follow environment boundaries:

| Environment | CDN Pattern |
|---|---|
| Development | Typically no CDN; files served directly from local storage or a dev bucket |
| Test / QA | No CDN, or a CDN pointed at the nonprod bucket/prefix |
| Staging | CDN configured identically to production but pointed at staging storage |
| Production | Live CDN with aggressive caching, DDoS protection, production storage origin |

> **Architecture Recommendation**: Staging CDN configuration should mirror production as closely as possible so that caching behavior, Cache-Control headers, and CDN-specific behaviors (signed URL validation, etc.) are tested before going live.

---

## 12. Security Considerations

### Signed URL Leakage
- A leaked signed URL is valid until it expires. Keep TTLs short.
- For high-sensitivity content, consider whether the CDN edge should validate a separate session token (via Cloudflare Workers or Lambda@Edge) rather than relying solely on the signed URL TTL.

### Hotlinking / Scraping of Public Assets
- Configure CDN Referer or Origin restrictions to prevent your public assets from being hotlinked by other domains consuming your CDN bandwidth.

### DDoS Protection
- CDNs (Cloudflare, CloudFront) provide DDoS protection at the edge, absorbing volumetric attacks before they reach origin servers or storage.
- Private origin buckets (not directly accessible via the public internet) are protected from direct attacks.

### Content-Type Validation
- Always validate file content-type and file signature (magic bytes) server-side before accepting an upload, regardless of what the client claims. A malicious upload claiming to be a JPEG but containing a script can lead to execution if served without proper headers.
- Set `Content-Disposition: attachment` for user-uploaded files to prevent browsers from executing content inline.

### CORS
- Configure CORS on your storage bucket to allow only your application's origin for presigned PUT uploads.
- Do not set `Access-Control-Allow-Origin: *` on buckets containing private user data.

---

## 13. Recommended CDN Baseline

Practical baseline for a serious web application.

### Public Assets
- Serve all public static assets (JS, CSS, images, fonts) via CDN.
- Use content-hashed filenames + `Cache-Control: public, max-age=31536000, immutable`.
- The origin (storage bucket) for public assets can be public-read.

### Private User Files
- Keep all buckets containing user data private.
- Use the **Backend Auth → Signed URL → Direct Storage/CDN** pattern.
- Set signed URL TTL to 15–60 minutes for downloads, 5–15 minutes for uploads.
- Do not store signed URLs in databases — generate on demand.
- Always perform your application authorization check before generating a signed URL.

### Caching Private Content
- Generally, do not cache per-user private content at the CDN edge.
- If you must cache private but non-user-specific content (e.g., role-gated documents identical for all users of that role), use CDN-level signed URL/cookie validation and a Custom Cache Key that excludes the auth token from the cache key.

### Environment CDN Configuration
- Production: full CDN with aggressive caching, signed URL validation, DDoS protection.
- Staging: mirror production CDN config, pointed at nonprod storage.
- Development: no CDN required; direct storage access is appropriate.

### Upload
- Direct-to-storage presigned PUT URL uploads only. The application server must not proxy file bytes.
- Multipart only for files over ~100 MB.

### Download
- Presigned GET URL for private files, served directly to the browser from storage/CDN.
- No application-level download chunking for ordinary web application files.
- HTTP Range Requests are handled automatically at the protocol/CDN/storage level.

### Summary of When to Use Each Pattern

| Scenario | Pattern |
|---|---|
| Public marketing images | Public CDN URL, aggressive caching |
| User-uploaded profile photo | Private bucket + presigned GET URL (short TTL) |
| Large video file | Private bucket + presigned GET URL; HTTP range requests handled automatically by browser and storage |
| Streaming video (HLS) | Application-level segmentation + CDN + HLS manifest |
| Resume upload of large file | Multipart upload with per-part presigned PUT URLs |
| Serving PDF attachment in browser | Presigned GET URL + `Content-Disposition: attachment` |
