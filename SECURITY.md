# Security policy and deployment work

This repository is an MVP demonstration. It is not certified for government records, personal citizen data, or production operations. Report suspected issues privately to the repository owner; do not include credentials or sensitive records in public issues.

## Implemented controls

- Salted scrypt password hashing, hashed opaque session/reset tokens, HttpOnly SameSite cookies, expiry/revocation and single-use reset invalidation.
- Explicit synthetic demo access; no committed usable password or provider key.
- Server-side department isolation, project membership, document access checks and read-only role restrictions.
- Explicit authenticated chat sharing with all retrieved sources retained as access dependencies; source access rechecked on reads.
- Reviewer role and identity validation; no self-approval; decisions bound to a version and valid state; PostgreSQL document row locking.
- File size/type/parser validation, expanded ZIP limits, UUID storage keys, attachment downloads, immutable application writes and SHA-256 checksums.
- Same-origin mutation checking plus custom client header, fixed CORS origin, API rate limits and security response headers.
- AI provider secrets remain server-side; retrieved text is treated as untrusted; model has no direct write/approval tool access.
- User-scoped notifications, application audit trail and protected audit endpoints.
- Local files/databases/environment files excluded from Git; staged credential-pattern scan script.

## Required production work

1. Disable demo mode and provision identities through approved SSO/MFA. Implement account activation/deactivation, password policy, recovery delivery and role lifecycle administration. WebAuthn is not configured.
2. Terminate TLS, enable Secure cookies/HSTS, tighten CSP with nonces, restrict internal API/network access and establish an approved secret manager/key rotation process. Current Next.js CSP allows inline/eval for compatibility and must be hardened.
3. Use Redis-backed distributed rate limits, authentication anomaly controls and per-user AI quotas. The current per-process limiter is not suitable for a multi-instance deployment.
4. Add malware scanning/content-disarm, parser sandboxing, request-body/reverse-proxy limits, asynchronous ingestion and private quarantined object storage. File parsers remain an attack surface. Scanned PDFs need authorised OCR.
5. Implement storage WORM/object lock, tamper-resistant external audit shipping, signed/verified backups, restore drills, disaster recovery, retention schedules, legal hold administration and authorised disposal. Application immutability does not constrain database/storage administrators.
6. Audit all authorisation paths against real policies, test PostgreSQL concurrency/isolation, review query scale and add field-level redaction where required. The MVP does not support cross-department sharing.
7. Complete independent threat modelling, dependency/security scanning, penetration testing, accessibility review and load testing. Prompt injection mitigations do not guarantee immunity. Verify external model data handling and document egress authorisation.
8. Authorise live outreach channels, approved templates, explicit citizen consent and opt-out handling before implementing any real transmission. Simulator has no sending connector.
9. Replace self-contained role strings/JSON consolidation with richer policy tables as needed. Expand notification recipient recalculation, group access and account lifecycle controls.
10. Define software/data retention, incident response, operational ownership and deployment approval. No governmental endorsement or deployment is implied.

## Known capability limits

Reset tokens are returned only for explicit synthetic demo accounts while demo mode is on; production reset email delivery is unavailable. No production administrator creation endpoint is exposed. Retention deletion is disabled. Speech, OCR, telephony, WhatsApp, external calendar and government-system integrations are not connected. Do not confuse configuration status or test doubles with a verified live integration.
