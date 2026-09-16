# Cloud Storage & Infrastructure Architecture Notes

This document is the authoritative reference for how production-grade applications separate environments, manage object storage, handle encryption, and control access. It is organized in three clearly labeled tiers:

- **📖 Industry Fact** — Documented practices from official sources (AWS, GCP, Azure, OWASP, etc.)
- **✅ Recommendation** — A defensible choice for most serious web applications
- **⚙️ Application-Dependent** — A decision that depends on your specific requirements

---

## 1. Environment Isolation

### 1.1 The Core Principle

📖 **Industry Fact**
AWS, Google Cloud, and Microsoft Azure all publish official guidance recommending that production environments be **hard-isolated** from non-production environments. AWS's whitepaper "Organizing Your AWS Environment Using Multiple Accounts" states:

> "We recommend that you use a multi-account strategy... Use individual AWS accounts to isolate resources between business units, development stages, and teams."
> — [AWS: Organizing Your AWS Environment](https://docs.aws.amazon.com/whitepapers/latest/organizing-your-aws-environment/organizing-your-aws-environment.html)

The core concept is **blast radius containment**: a misconfiguration, compromised credential, or runaway script in a DEV account cannot propagate to PROD if they are in entirely separate accounts/projects.

### 1.2 Isolation Levels Compared

There are multiple levels of isolation, each with different trade-offs:

| Isolation Method | Blast Radius | Credential Separation | Cost | Complexity |
|---|---|---|---|---|
| Same bucket, same prefix | None | None | Lowest | Lowest |
| Same bucket, separate prefixes | None | None | Low | Low |
| Separate buckets, same account/project | Partial | Partial | Low | Low |
| Separate accounts/projects | Hard | Complete | Medium | Medium |

**Separate prefixes within one bucket:**
```text
single-bucket/
├── dev/
├── test/
├── staging/
└── prod/
```
📖 **Industry Fact**: This is **not** considered sufficient isolation for production. All prefixes share the same IAM credentials, bucket policies, and access logs. A single misconfigured policy can expose all environments simultaneously. Prefix-level separation is the lowest rung of isolation — it is a naming convention, not a security boundary.

**Separate buckets, same account:**
```text
account/
├── app-dev-bucket
├── app-staging-bucket
└── app-prod-bucket
```
📖 **Industry Fact**: Separate buckets provide per-bucket IAM policies, encryption settings, and lifecycle rules. However, a compromised account-level credential (an admin key, for example) can still access all buckets. This is a common pattern for small teams and startups.

**Separate non-prod and prod buckets:**
```text
nonprod-bucket     (dev + test + staging share this)
prod-bucket        (production only)
```
✅ **Recommendation**: This is a reasonable architecture for small to medium teams. It is a meaningful improvement over prefix-only separation. Non-production environments share infrastructure (and thus cost) while production data is kept completely isolated.

**Separate accounts/projects per environment:**
```text
nonprod-account
 ├── dev bucket
 ├── test bucket
 └── staging bucket

prod-account
 └── prod bucket
```
📖 **Industry Fact**: AWS explicitly recommends this pattern for regulated workloads and enterprises. Separate accounts guarantee that a leaked non-production credential has zero access to production resources.

✅ **Recommendation**: This is the target for any application that handles sensitive user data, financial records, or that is subject to compliance requirements (GDPR, HIPAA, PCI-DSS, etc.). For smaller projects, starting with separate buckets and migrating to separate projects is a valid incremental path.

### 1.3 When Prefix Isolation Is Acceptable

⚙️ **Application-Dependent**: Prefix-only isolation (`bucket/dev/`, `bucket/prod/`) is acceptable when:
- The application is in early development with no sensitive data
- The team is a single developer with no risk of cross-environment credential misuse
- Cost is the overriding constraint and no regulatory requirements exist

It is **not** acceptable when:
- The bucket contains user PII, financial documents, or health data
- Multiple developers have independent access
- The application is in production serving real users

---

## 2. Object Storage Architecture

### 2.1 Bucket-per-Application vs. Bucket-per-Data-Class

📖 **Industry Fact**: Both patterns are documented and used in production. The choice depends on data classification, access control needs, and lifecycle requirements.

**Bucket-per-data-class** (recommended for sensitive data):
```text
app-public-bucket      (community content, banners, public assets)
app-private-bucket     (user documents, invoices, PII)
```
This makes access control explicit: one bucket policy covers all public content, another covers all private content. There is no risk of accidentally making private content public by misconfiguring a single object ACL.

**Single bucket with prefixes** (acceptable for simple applications):
```text
prod-bucket/
├── users/
├── uploads/
└── documents/
```
✅ **Recommendation**: Use separate buckets for public and private content. This eliminates an entire class of misconfiguration-driven data exposure. Within each bucket, use prefixes for organization.

### 2.2 Private vs. Public Buckets

📖 **Industry Fact**: AWS, Google Cloud, and Azure all recommend enabling "Block Public Access" at the account level as a baseline security control. The S3 documentation states:

> "We recommend that you block all public access to your buckets unless you specifically need public access."
> — [AWS S3 User Guide](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html)

✅ **Recommendation**:
- **Public bucket**: Use only for genuinely public content (marketing images, public documents). Enable CDN caching.
- **Private bucket**: Use for all user-generated content and sensitive files. Access via signed URLs or a backend proxy only. Never enable public access.

### 2.3 Lifecycle Policies, Versioning, and Backups

📖 **Industry Fact**: Major cloud providers offer object lifecycle management for automated transitions (e.g., S3 Standard → S3 Glacier after 90 days) and expiration policies.

✅ **Recommendation**:
- Enable **versioning** on production buckets to protect against accidental deletion or overwrites.
- Configure **lifecycle policies** to move old versions to cheaper storage tiers after a defined period.
- For disaster recovery, consider **cross-region replication** (S3) or equivalent on critical production data.
- DEV and TEST buckets generally do not require versioning or replication.

---

## 3. Encryption

Encryption is often discussed as a single concept, but it covers four distinct concerns that must not be conflated.

### 3.1 The Four Types of Encryption

| Type | What It Protects | Who Controls the Key |
|---|---|---|
| **Transport Encryption (TLS)** | Data in transit between client and server | Certificate Authority / TLS config |
| **Encryption at Rest (Provider-Managed)** | Data stored on disk against physical media theft | Cloud provider (e.g., AWS, GCP) |
| **Customer-Managed Encryption (CMK/CMEK)** | Data at rest with your own key management | You, via KMS/HSM |
| **Application-Level Encryption** | Data before it enters the storage layer | Your application |

### 3.2 Provider-Managed Encryption at Rest

📖 **Industry Fact**: As of 2023, AWS S3 applies **SSE-S3 (Server-Side Encryption with S3-Managed Keys)** by default to all new objects. This means all data stored in S3 is encrypted at rest automatically at no extra cost.

From [AWS S3 Encryption Documentation](https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingEncryption.html):
- **SSE-S3**: AWS manages both data keys and master keys. Free, automatic.
- **SSE-KMS**: AWS KMS manages keys. You get audit logs (CloudTrail) and fine-grained access control per key. Costs extra per request. Required for many compliance frameworks.
- **SSE-C (Customer-Provided Keys)**: You provide the encryption key on every request. AWS encrypts with it but never stores the key.

✅ **Recommendation**: SSE-S3 (or Supabase's equivalent provider-managed encryption) is sufficient for most production web applications. Move to SSE-KMS (or equivalent) if you have regulatory compliance requirements (HIPAA, PCI-DSS) that mandate audit trails.

### 3.3 Application-Level Encryption

📖 **Industry Fact**: Application-level encryption means the application encrypts data **before** sending it to the storage provider. The storage provider only ever sees ciphertext and cannot read the data even with storage-level access.

Application-level encryption is justified when:
- The security requirement is that **even the storage provider cannot read the data**
- Regulatory frameworks mandate that keys never leave the customer's infrastructure
- The application must protect against insider threats at the cloud provider level

Application-level encryption introduces significant complexity:
- Key management, storage, and rotation become your responsibility
- You cannot use CDN caching on the encrypted content directly (the CDN would cache encrypted bytes)
- Decryption must happen either at the backend (before streaming to client) or at the client (introducing key exposure risk)

📖 **Industry Fact** (OWASP): Encryption keys must never be embedded in client-side JavaScript, mobile application binaries, public URLs, signed URLs, URL query parameters, or storage object metadata. Any key material accessible to an untrusted client must be considered compromised.

⚙️ **Application-Dependent**: Application-level encryption is **not** required merely because a system is production-grade. It is required only when you have a specific threat model that includes the storage provider itself as an adversary, or when compliance frameworks explicitly mandate it.

### 3.4 Why Keys Cannot Live in the Client

Even if a mobile app or browser bundle is obfuscated, any key material inside it must be treated as public:
- Mobile apps can be decompiled and analyzed with tools like `jadx` (Android) or `class-dump` (iOS)
- Browser JavaScript is always readable in the developer console
- A motivated attacker with physical access to a rooted device can extract secrets from the app's sandbox

The conclusion is that encryption keys must be managed exclusively by the backend. If application-level encryption is required, the backend encrypts before storing and decrypts before streaming back to the client.

---

## 4. Private Files and CDN

### 4.1 Why a Hidden URL Is Not Access Control

📖 **Industry Fact**: Storing a file in a bucket and sharing an obscure URL is not access control. Object storage URLs follow predictable patterns. Once a URL is known (from a shared link, browser history, or log file), anyone can access the object. Access control requires authentication and authorization — not obscurity.

### 4.2 Three Patterns for Private Content Delivery

**Pattern A — Public CDN (no access control):**
```text
Browser → CDN → Object Storage (public bucket)
```
Acceptable only for content that is genuinely public and can be freely shared by anyone.

**Pattern B — Backend Proxy (full authorization):**
```text
Browser → Authenticated Backend → Object Storage (private bucket)
              ↑
         Validates JWT,
         checks permissions,
         streams response
```
The backend is the only client that has storage credentials. The storage endpoint is never exposed to the browser. This is the most secure pattern for sensitive files, and it allows the backend to apply arbitrary authorization logic. The trade-off is that all download bandwidth passes through your application servers.

**Pattern C — Backend Authorization → Signed URL (recommended for most cases):**
```text
Browser → Backend (authorize) → Issue Signed URL → Browser → CDN/Storage
```
The backend validates the user's identity and permissions, then generates a time-limited signed URL that grants temporary direct access. The browser then downloads the file directly from the CDN using that URL. This offloads bandwidth from your backend while maintaining authorization.

✅ **Recommendation**:
- **Public assets** (logos, marketing content): Pattern A (public CDN, no signed URLs needed)
- **Semi-private assets** (user avatars, non-sensitive uploads): Pattern C (signed URLs, 15-minute expiry)
- **Sensitive assets** (financial documents, PII, health records): Pattern B (backend proxy) or Pattern C with very short expiry and per-request generation

### 4.3 Signed URLs

📖 **Industry Fact**: Signed URLs are cryptographically signed URIs that grant time-limited access to a specific object in private storage. They do not require the user to have storage credentials. Key properties:
- **Expiry**: A short expiry (5–15 minutes) is standard practice to minimize the impact of a leaked URL
- **They are not revocable**: Once issued, a signed URL is valid until it expires. Revoking access requires rotating the signing key (which invalidates all outstanding URLs)
- **They should be generated server-side**: The signing key must never leave the backend

📖 **Industry Fact**: AWS CloudFront documentation distinguishes between **signed URLs** (for individual files) and **signed cookies** (for multiple files or streaming sessions). Signed cookies are preferable for video streaming because the player can request many segments without the backend generating a new URL for each.

---

## 5. Upload Architecture

### 5.1 When to Use Multipart Uploads

📖 **Industry Fact** (from [AWS S3 Documentation](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html)):

> "It's a best practice to use multipart upload for objects that are **100 MB or larger** instead of uploading them in a single operation."

Single-part PUT is allowed up to 5 GB in S3. For objects between 5 MB and 5 GB, multipart upload is optional but recommended above 100 MB for network resilience.

**When multipart upload is NOT necessary:**
- Files under 100 MB on a reliable connection (typical web form uploads, avatars, small documents)
- Internal server-to-server transfers on reliable networks
- Simple CRUD applications without large media

**When multipart upload IS necessary or strongly recommended:**
- Video uploads (typically > 100 MB)
- Any upload on a mobile network where connections drop frequently
- Files approaching 5 GB (required by the protocol above that limit)
- Any scenario where resumability is required

✅ **Recommendation**: Gate multipart upload on file size, not application tier. Files < 10 MB: single PUT. Files ≥ 10 MB: multipart. This threshold is lower than AWS's recommendation because mobile networks are less reliable than data center networks.

### 5.2 Upload Integrity

📖 **Industry Fact**: S3 supports MD5 and SHA-256 checksums on individual parts and on the final assembled object. Providing a checksum allows S3 to verify that the data was not corrupted in transit. Supabase Storage, being S3-compatible, supports the same mechanisms.

✅ **Recommendation**: Include a checksum on uploads for any data where integrity matters. This is especially important for application-level encrypted content where a corrupted chunk would produce garbage on decryption.

---

## 6. Download Architecture

### 6.1 Range Requests (HTTP 206)

📖 **Industry Fact**: HTTP range requests (using the `Range` request header and `206 Partial Content` response) are an HTTP/1.1 standard mechanism that allows clients to request specific byte ranges of a resource. They are **not** the same as application-level chunking.

Range requests are used by:
- **Video players** to seek within a video file without downloading the entire file
- **Download managers** to resume interrupted downloads
- **PDF viewers** to load specific pages without fetching the entire document

📖 **Industry Fact**: In HTTP/2 and HTTP/3, `Transfer-Encoding: chunked` is not used (it is a HTTP/1.1 mechanism). HTTP/2 frames data natively. However, the **concept** of streaming a response as it is generated remains valid.

**The key distinction:**
| Concept | Who drives it | What it is |
|---|---|---|
| Multipart upload | Client sends in parts | Uploading a large file in pieces |
| HTTP range request | Client requests a byte range | Downloading a portion of a known-size file |
| Application chunking (download) | Server splits and sends | Streaming unknown-length data or decrypting on the fly |

✅ **Recommendation**: For normal downloads from object storage, download chunking is not necessary. Object storage providers serve the full object efficiently. Use range requests only when the use case requires it (video seeking, resume). Use streaming responses (application-level) when the server must decrypt or transform the data before sending.

---

## 7. Database Environment Isolation

📖 **Industry Fact**: Industry consensus is that production databases must not share infrastructure with development environments. The reasons are:
- **Credentials**: A dev credential that can also reach production data is a critical security vulnerability
- **Data contamination**: Test data written to production corrupts business records
- **Migrations**: A schema migration applied to the wrong environment can be catastrophic
- **Performance**: Load testing in DEV on a shared DB degrades production response times

| Feature | DEV | Staging | Production |
|---|---|---|---|
| Data | Synthetic / mocked | Anonymized copy of prod | Real business data |
| Size | Minimal | Representative | Full |
| Security | Flexible | High | Maximum |
| Credentials | Dev-only | Staging-only | Prod-only |
| Backups | Optional | Recommended | Required |

📖 **Industry Fact** (from Microsoft, MongoDB, and others): If lower environments need real data for testing, use **data masking or anonymization** — never copy raw production PII into a test environment.

---

## 8. IAM and Credentials

📖 **Industry Fact** (Principle of Least Privilege): Each environment should have its own set of credentials scoped to only the resources that environment requires.

```text
DEV service account  → read/write to DEV bucket only
PROD service account → read/write to PROD bucket only
```

A leaked DEV credential must not be able to access PROD storage. This is enforced by separate credentials, not just by hoping developers won't misuse a shared credential.

📖 **Industry Fact**: AWS Secrets Manager, GCP Secret Manager, Azure Key Vault, and HashiCorp Vault are the standard tools for managing application secrets. The Twelve-Factor App methodology ([12factor.net](https://12factor.net/config)) specifies that configuration (including credentials) must be injected at runtime via environment variables, never hardcoded in source code.

**Key rotation** is a requirement, not a recommendation, for credentials with access to production data. Automated rotation via a secrets manager reduces the risk window if a credential is ever leaked.

---

## 9. Full Environment Mapping

The complete environment mapping for a production web application:

```text
DEV
 ├── DEV application (local or dev server)
 ├── DEV database (separate instance)
 ├── DEV storage bucket (separate bucket or project)
 ├── DEV secrets (dev-only credentials)
 └── CDN not required (local serve is sufficient)

TEST / QA
 ├── TEST application (CI/CD ephemeral or shared non-prod)
 ├── TEST database (separate instance, synthetic data)
 ├── TEST storage (shared with non-prod or separate)
 └── TEST secrets (non-prod credentials)

STAGING
 ├── STAGING application (mirrors prod configuration)
 ├── STAGING database (anonymized prod data copy)
 ├── STAGING storage bucket (separate, production-equivalent config)
 ├── STAGING secrets (staging-specific credentials)
 └── STAGING CDN (ideally same CDN provider, separate distribution)

PRODUCTION
 ├── PROD application
 ├── PROD database (isolated, backups, monitoring)
 ├── PROD storage (private bucket, versioning, replication)
 ├── PROD secrets (prod-only, rotated, audited)
 └── PROD CDN (global distribution, origin locked down)
```

⚙️ **Application-Dependent**: Whether this is a strict rule or a guideline depends on the application's risk profile. A single-developer internal tool may collapse TEST and DEV. A fintech or health application must treat this as a hard requirement.

---

## 10. Secure Media Asset Pipeline (Implementation Reference)

For applications that need to serve private files through a backend proxy (Pattern B from Section 4), the following is the standard implementation pattern.

### Conceptual Flow
```text
┌──────────────────┐               ┌────────────────┐               ┌──────────────────┐
│  REACT FRONTEND  │   ───(1)───>  │ DJANGO BACKEND │   ───(2)───>  │  PRIVATE STORAGE │
│                  │   <───(4)───  │   (REST API)   │   <───(3)───  │  (Private Bucket)│
└──────────────────┘               └────────────────┘               └──────────────────┘
 • Sends Bearer Token               • Validates JWT                   • Completely Hidden
 • /bills/?bill_id=X                • Checks permissions              • Uses Service Role
                                    • Streams Binary Data             • Blocked from Internet
```

1. Frontend sends a request with a Bearer Token (no storage credentials, no storage URL).
2. Backend validates the JWT, extracts the user identity, and checks authorization.
3. Backend fetches the file from private storage using its internal service key.
4. Backend streams the binary response to the frontend.

### Frontend Pattern (`axiosInstance`)
```typescript
import axiosInstance from '@/services/core/axiosinstance';

export const fetchAndDisplayBill = async (billId: string): Promise<void> => {
  const response = await axiosInstance.get(`/bills/`, {
    params: { bill_id: billId },
    responseType: 'blob'
  });

  const blob = response.data;
  const fileUrl = window.URL.createObjectURL(blob);
  window.open(fileUrl, '_blank');
};
```

### Backend Proxy Pattern (Django)
```python
import requests
from django.http import StreamingHttpResponse, HttpResponse
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

class SecureFileProxyView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, bill_id, user_id):
        return f"jpa/user/{user_id}/bills/bill_{bill_id}.pdf"

    def get(self, request, *args, **kwargs):
        bill_id = request.query_params.get('bill_id')
        if not bill_id:
            return HttpResponse("Missing bill_id parameter.", status=400)

        logical_path = self.get_object(bill_id, request.user.id)
        storage_url = f"{settings.STORAGE_ENDPOINT_URL}/private-bucket/{logical_path}"
        headers = {"Authorization": f"Bearer {settings.STORAGE_SERVICE_KEY}"}

        try:
            storage_response = requests.get(storage_url, headers=headers, stream=True)
            if storage_response.status_code == 404:
                return HttpResponse("File not found.", status=404)
            if storage_response.status_code != 200:
                return HttpResponse("Storage error.", status=502)

            response = StreamingHttpResponse(
                storage_response.iter_content(chunk_size=8192),
                content_type=storage_response.headers.get('Content-Type', 'application/octet-stream')
            )
            response['Content-Disposition'] = f'inline; filename="bill_{bill_id}.pdf"'
            return response
        except requests.exceptions.RequestException:
            return HttpResponse("Storage timeout.", status=500)
```

---

## 11. Recommended Baseline

This section summarizes the practical baseline for a normal production web application. These are recommendations, not universal requirements.

| Decision | Recommendation | Notes |
|---|---|---|
| DEV vs PROD storage | **Separate buckets minimum; separate projects preferred** | Separate projects eliminate cross-env credential risk entirely |
| TEST/STAGING | **Share non-prod infrastructure or have separate resources** | Staging should mirror prod config; DEV/TEST can share if non-sensitive |
| Separate cloud projects/accounts | **Preferred when available** | Use when regulatory requirements or team size justifies the overhead |
| Prefixes inside buckets | **Yes, for organizational clarity** | Even with separate buckets, use prefixes like `/uploads/`, `/documents/` |
| Production storage access | **Private by default** | Block public access; use signed URLs or backend proxy for delivery |
| Provider-managed encryption | **Sufficient for most applications** | SSE-S3 or equivalent is always on and costs nothing extra |
| Application-level encryption | **Required only for specific threat models** | Needed when storage provider access must be denied; adds significant complexity |
| Upload chunking (multipart) | **Conditional on file size** | Recommended for files ≥ 10-100 MB; unnecessary for small uploads |
| Download chunking | **Not required by default** | Use HTTP range requests for seeking; streaming is needed only when transforming on the fly |

---

*Sources: [AWS Whitepaper: Organizing Your AWS Environment](https://docs.aws.amazon.com/whitepapers/latest/organizing-your-aws-environment/organizing-your-aws-environment.html) · [AWS S3 Multipart Upload](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html) · [AWS S3 Encryption](https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingEncryption.html) · [AWS S3 Block Public Access](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html) · [AWS CloudFront Signed URLs](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/PrivateContent.html) · [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html) · [12factor.net](https://12factor.net/config)*
