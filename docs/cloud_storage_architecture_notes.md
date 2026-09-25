# Cloud Storage Architecture Notes
> **Purpose**: General industry reference for production cloud storage patterns.
> **Not application-specific.** No assumptions about any particular project are made here.
> **Last Updated**: 2026-09-25

---

## Table of Contents
1. [Environment Isolation](#1-environment-isolation)
2. [Object Storage Architecture](#2-object-storage-architecture)
3. [Encryption](#3-encryption)
4. [IAM and Credentials](#4-iam-and-credentials)
5. [Database Environment Isolation](#5-database-environment-isolation)
6. [Upload Architecture](#6-upload-architecture)
7. [Download Architecture](#7-download-architecture)
8. [Deployment Relationship](#8-deployment-relationship)
9. [Recommended Baseline](#9-recommended-baseline)

---

## 1. Environment Isolation

### 1.1 The Four Standard Environments

Most production systems define four logical tiers:

| Environment | Purpose |
|-------------|---------|
| **Development** | Individual developer work; frequent breakage acceptable |
| **Test / QA** | Automated tests; integration tests; may use synthetic data |
| **Staging** | Mirror of production; final validation before release |
| **Production** | Live system; real users and real data |

### 1.2 Isolation Mechanisms — Compared

There are several ways to isolate environments, ranging from the weakest to the strongest boundary:

#### Prefixes/Folders within a single bucket
```
single-bucket/
├── dev/
├── test/
├── staging/
└── prod/
```

> **Industry Fact**: This is the weakest form of isolation. A bucket policy mistake or an IAM misconfiguration can allow a dev process to read or overwrite prod data. AWS S3 does not treat prefixes as security boundaries — they are purely organizational.

**When it is acceptable**: Internal tooling, personal developer sandboxes, very early-stage startups where operational simplicity outweighs the risk.
**When it is NOT acceptable**: Regulated data (financial, healthcare), any system where a compromised dev credential must not reach production data.

---

#### Separate Buckets, Same Account
```
my-account/
├── nonprod-bucket  (dev, test, staging prefixes)
└── prod-bucket
```

> **Industry Fact**: Separate buckets within the same account do provide a meaningful boundary. IAM policies can grant access to one bucket and deny the other. However, the same AWS account still shares service quotas, billing, and administrative IAM — so a root-level mistake still affects both.

**A practical pattern for smaller teams**:
- `nonprod-bucket` — shared by dev, test, and staging with prefix-level organization
- `prod-bucket` — dedicated, with the most restrictive policies

This is a reasonable baseline for a serious web application that cannot yet justify multi-account infrastructure.

---

#### Separate Cloud Accounts / Projects / Subscriptions
```
nonprod-account/
├── dev resources
├── test resources
└── staging resources

prod-account/
└── production resources
```

> **Industry Fact (AWS)**: AWS explicitly recommends separate accounts per environment as part of its AWS Organizations / Control Tower best-practice architecture. Each account is a hard security boundary — IAM policies, service quotas, and billing are fully separate. A compromise in dev cannot touch prod even if both accounts are under the same Organization.
> Source: https://docs.aws.amazon.com/whitepapers/latest/organizing-your-aws-environment/organizing-your-aws-environment.html

**When larger systems use this**: Enterprises with compliance requirements (PCI-DSS, HIPAA, SOC 2), systems handling financial or health data, any system where a dev compromise reaching prod is unacceptable.

**Trade-off**: Significant operational overhead. Cross-account IAM roles, separate billing, separate pipelines.

---

### 1.3 Summary: Which Isolation Level to Choose

| Scale / Risk | Recommended Isolation |
|---|---|
| Prototype / very early stage | Prefix-based, single bucket |
| Growing startup, serious product | Separate `nonprod` and `prod` buckets, same account |
| Regulated / sensitive data | Separate AWS accounts per environment |
| Enterprise / compliance mandated | Separate accounts via AWS Organizations + SCPs |

> **Architecture Decision (Not Industry Rule)**: There is no single universally "correct" answer. The decision depends on your risk profile, team size, compliance requirements, and operational capacity. Do not treat separate accounts as mandatory for all applications.

---

## 2. Object Storage Architecture

### 2.1 Bucket Strategy Patterns

#### One bucket per environment
```
dev-myapp-bucket
staging-myapp-bucket
prod-myapp-bucket
```
Simple IAM targeting, clear blast radius. Higher bucket count, but most providers allow hundreds of buckets.

#### One bucket, multiple prefixes per application domain
```
prod-myapp/
├── users/
├── products/
├── orders/
└── documents/
```

> **Industry Fact**: AWS recommends using prefixes for organizational clarity within a bucket, not as a security mechanism. Access control is at bucket-level and IAM-level.

Use this pattern when: A single application owns all the data and a unified lifecycle policy applies across all object types.

#### Bucket per data classification
```
prod-public-assets
prod-private-user-files
prod-backups
prod-logs
```

Use this pattern when: Different data classes have fundamentally different access policies, lifecycle rules, or compliance requirements.

---

### 2.2 Private vs Public Buckets

> **Industry Fact**: AWS S3's "Block Public Access" setting is enabled by default on new accounts since 2023. The AWS recommended default is: all production buckets are private.

**Public buckets**: Only appropriate for genuinely public static assets (marketing images, public documentation). Never for user-generated content, PII, or business data.

**Private buckets + signed URLs**: The standard pattern for private user files.

---

### 2.3 Lifecycle Policies, Versioning, and Retention

Source: https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html

- **Lifecycle policies**: Move objects to cheaper storage tiers (e.g., Glacier) after X days, or delete them automatically.
- **Versioning**: Retains all versions of every object. Protects against accidental overwrites and deletes. Increases storage cost.
- **Retention / Object Lock**: WORM compliance locking for regulated industries.
- **Replication**: Cross-region replication for disaster recovery or latency optimization.
- **Abort incomplete multipart uploads**: Always configure a lifecycle rule to abort stale multipart uploads (e.g., after 7 days) to prevent storage cost accrual.

---

## 3. Encryption

There are four distinct encryption concerns. They are **separate topics and must not be conflated**.

### 3.1 Encryption in Transit (TLS)

> **Industry Fact**: All major cloud providers enforce TLS (HTTPS) on all API and storage endpoints by default. This is table stakes and requires no special implementation for most applications.

### 3.2 Encryption at Rest — Provider-Managed (SSE-S3)

> **Industry Fact**: As of January 2023, AWS S3 automatically encrypts all new objects using SSE-S3 (AES-256) by default, at no extra charge, with no configuration required.
> Source: https://docs.aws.amazon.com/AmazonS3/latest/userguide/default-encryption-faq.html

- **What it protects against**: Physical theft of storage media from AWS data centers.
- **What it does NOT protect against**: IAM misconfiguration that grants a malicious actor legitimate API access — they still receive decrypted data.
- **When it is sufficient**: The vast majority of production applications.

### 3.3 Encryption at Rest — Customer-Managed Keys (SSE-KMS)

> **Industry Fact**: SSE-KMS with Customer Managed Keys adds a second access control layer. Even with S3 bucket permissions, KMS key permissions are also required to decrypt. Every decryption is logged in AWS CloudTrail.

- **When required**: PCI-DSS, HIPAA, SOC 2 Type II; systems where regulatory auditors require proof of who decrypted data and when; separation of duties between storage admins and encryption key admins.
- **Trade-off**: Additional cost per KMS API call and additional operational complexity.

### 3.4 Application-Level (Client-Side) Encryption

> **Industry Fact (OWASP)**: Application-level / client-side encryption is appropriate when a "zero-knowledge" model is required — the server must be technically incapable of reading the data.
> Source: https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html

- **Consequence**: The server cannot search, index, process, or transform the data.
- **Key loss = data loss**: No recovery path if user loses their key.
- **When NOT required**: If protection is only needed against disk theft or external breach, provider-managed encryption is sufficient and far simpler.

> **Architecture Recommendation**: For most web applications, provider-managed SSE-S3 (or SSE-KMS for regulated data) is the correct choice. Application-level encryption is only justified by a documented zero-knowledge requirement.

### 3.5 Where Keys and Credentials Must Never Appear

The following are insecure locations for encryption keys or storage credentials:

- Frontend JavaScript (exposed to any browser)
- Browser localStorage or sessionStorage (accessible to XSS attacks)
- Public URLs
- Signed URLs (temporary credentials — treat as sensitive but they are not encryption keys)
- Mobile app binaries (reversible by decompilation)
- Version control repositories

---

## 4. IAM and Credentials

### 4.1 The Core Principle

```
DEV credentials  →  DEV resources only
PROD credentials →  PROD resources only
```

> **Industry Fact**: Reusing credentials across environments is an anti-pattern explicitly warned against by AWS, GCP, Azure, and OWASP. A compromised dev environment should never provide a path to production.

### 4.2 Least Privilege

- Every service account, IAM role, or application identity should have the minimum permissions required and nothing more.
- AWS IAM Access Analyzer can identify and report on overly permissive policies.

### 4.3 Secrets Management

> **Industry Fact**: AWS Secrets Manager, GCP Secret Manager, Azure Key Vault, and HashiCorp Vault are dedicated secrets management systems. The documented best practice is to inject secrets at runtime via authenticated API calls, not store them in environment variable files committed to version control.

- **Never**: Hardcode keys in source code, store real credentials in git, or log secrets.
- **Always**: Use a secrets manager in production; rotate credentials on a schedule; scope access to specific environments.

---

## 5. Database Environment Isolation

### 5.1 The Standard Pattern

```
DEV DB     (separate instance, separate credentials)
TEST DB    (separate instance or schema, separate credentials)
STAGING DB (separate instance, mirrors prod structure, anonymized data)
PROD DB    (most restrictive access, separate credentials, full backups)
```

> **Industry Fact**: Running development and production workloads on the same database instance is a recognized anti-pattern. Key risks: accidental data mutation, migration failures destroying prod schema, resource contention, leaked production data into development environments.

### 5.2 Key Concerns per Environment

| Concern | Dev | Staging | Prod |
|---|---|---|---|
| **Credentials** | Separate, weak OK | Separate, realistic | Separate, strong, rotated |
| **Data** | Synthetic or anonymized | Anonymized snapshot of prod | Real user data |
| **Migrations** | Run freely | Test before prod | Applied with rollback plan |
| **Backups** | Optional | Recommended | Mandatory, tested |
| **Access** | Wide developer access | Limited | Minimal, audited |

### 5.3 Data Masking / Anonymization

> **Industry Fact**: GDPR (Article 25 — Data Protection by Design) and general security practice require that personal data not be used in non-production environments without appropriate anonymization or pseudonymization. Copying production user data into dev/staging without masking is a compliance violation in many jurisdictions.

---

## 6. Upload Architecture

### 6.1 Normal (Single-Part) Uploads

A standard HTTP PUT or POST is appropriate for files under ~100 MB on reliable networks.

The recommended production pattern (no server proxy):
```
1. Client authenticates with backend
2. Backend generates a presigned PUT URL (after authorization check)
3. Client uploads directly to object storage via the presigned URL
4. Client notifies backend of completion
5. Backend validates and records the upload
```

This prevents application servers from being memory-saturated by large file transfers.

### 6.2 Multipart Uploads

> **Industry Fact (AWS)**: S3 requires multipart upload for objects over 5 GB. AWS recommends multipart upload for objects over 100 MB.
> Source: https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html

Benefits: Resume failed parts (not the full file), parallel part uploads, begin before total size is known.

**Always configure a lifecycle rule** to abort incomplete multipart uploads after ~7 days to avoid storage cost accrual.

> **Architecture Decision**: Multipart upload is not required for ordinary web applications handling user-generated images, PDFs, or documents. It is only justified when the application commonly deals with large video files or dataset uploads (>100 MB).

### 6.3 Checksum / Integrity Validation

> **Industry Fact**: S3 supports MD5 and SHA-256 checksums on PUT operations via `Content-MD5` or `x-amz-checksum-sha256` headers. S3 rejects uploads that arrive corrupted.

For applications where data integrity is critical (financial records, medical documents), computing and validating a checksum at upload time is documented best practice.

---

## 7. Download Architecture

### 7.1 Complete Object Download

The default. Client requests the full object and receives the complete response.
Appropriate for: documents, images, configuration files, exports — the overwhelming majority of web application download scenarios.

### 7.2 HTTP Range Requests

> **Industry Fact**: HTTP Range Requests (RFC 9110) allow a client to request a byte range of a resource (`Range: bytes=0-1048576`). S3, GCS, and Azure Blob Storage all support this natively. Browsers use this automatically for media seeking and download resumption.

- Video/audio seeking: A video player requests only the bytes for the current playback position.
- Resumable downloads: Resume from the last received byte after a connection drop.
- CDN partial caching: CDNs cache individual ranges ("slice-based caching"), improving efficiency for large files.

> This is a **protocol-level feature**. S3 handles it automatically. No application code is required.

### 7.3 Application-Level Download Chunking

Manually splitting a large object into multiple application-managed sub-files before storage. Used for:
- Streaming video protocols (HLS `.ts` segments, DASH `.m4s` fragments)
- Processing pipelines where a worker can only hold X MB in memory

> **Architecture Decision**: Application-level download chunking is NOT the same as HTTP range requests and is NOT required for ordinary downloads in web applications. A production application serving PDFs, images, or even moderate-size video files does not need application-level chunking — the CDN and HTTP range requests handle it at the protocol level.

---

## 8. Deployment Relationship

Each environment tier should have a corresponding set of infrastructure:

```
DEV
├── DEV application deployment
├── DEV database (credentials, instance)
├── DEV object storage (separate bucket or prefix)
├── DEV secrets (separate vault paths)
└── DEV CDN configuration (or no CDN)

STAGING
├── STAGING application deployment
├── STAGING database (separate credentials, anonymized data)
├── STAGING object storage (nonprod bucket)
├── STAGING secrets (separate vault paths)
└── STAGING CDN configuration (mirrors prod)

PROD
├── PROD application deployment
├── PROD database (most restrictive, separate credentials)
├── PROD object storage (dedicated prod bucket, strictest policies)
├── PROD secrets (most restricted vault)
└── PROD CDN configuration (live, caching active)
```

> **Architecture Decision (Not a Hard Rule)**: The above is the recommended architectural pattern. Very small teams may share staging and non-prod CDN configuration. The principle is: production resources should be isolated from non-production resources, and the stricter the isolation, the smaller the blast radius of any incident.

---

## 9. Recommended Baseline

Practical baseline for a **serious, non-trivial web application** that is not yet at enterprise scale. These are recommendations, not industry mandates.

### Environment Isolation
- Use **separate buckets** for production and non-production. A single `nonprod-bucket` with prefixes for dev/test/staging is acceptable for lower environments.
- Separate cloud accounts per environment are preferable when available and when operational capacity exists. For smaller teams, separate buckets within one account is a pragmatic starting point.
- Always use prefixes within buckets for organizational clarity.

### Storage
- All production storage should be private (Block Public Access enabled). Signed URLs for all private file access.
- Use separate buckets for data with fundamentally different access policies (public assets vs. private user files).
- Configure lifecycle rules for log rotation and incomplete multipart upload cleanup.
- Enable versioning on production buckets containing critical user data.

### Encryption
- **Provider-managed encryption at rest (SSE-S3 / AES-256) is sufficient** for the vast majority of web applications. It is on by default on S3.
- Upgrade to **SSE-KMS with CMK** only when compliance (PCI-DSS, HIPAA) or audit requirements mandate key-level access logging.
- **Application-level (client-side) encryption is only justified** when a documented zero-knowledge requirement exists — not for general-purpose storage.
- Enforce TLS on all endpoints. This is the default on all major providers.

### IAM and Credentials
- **Never reuse credentials across environments.** Every environment must have its own IAM roles and storage credentials.
- Apply the principle of least privilege. Each application component should have only the permissions it needs.
- Use a secrets manager in production. Do not store credentials in source code or committed `.env` files.

### Uploads
- Use **direct-to-storage presigned URL uploads** (not proxied through the application server).
- **Multipart upload is only required for files over ~100 MB or where resumability is needed.** It is not required for ordinary web application file handling.

### Downloads
- **Download chunking is not required for ordinary web applications.** Complete object downloads via signed URL or public CDN URL are appropriate for documents, images, and moderate-size files.
- HTTP Range Requests for video/audio seeking are handled automatically by browsers and CDNs.
- Application-level chunking should only be introduced for streaming video pipelines (HLS/DASH) or large-scale data processing.
