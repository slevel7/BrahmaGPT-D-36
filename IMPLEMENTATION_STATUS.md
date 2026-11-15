> Incremental update: see [current feature matrix](docs/FEATURE_MATRIX.md) and [grounded drafting guide](docs/GROUNDED_DRAFTING.md). The source-grounded draft and sequential approval extension supersedes older limitations below where explicitly stated. The full master specification remains incomplete.

# BrahmaGPT implementation record

The source prompt is the scope baseline. No government endorsement or production readiness is claimed.

## Plan
1. Foundation: Next.js shell, FastAPI, SQLAlchemy, migrations, secure cookie sessions, department isolation and demo seed.
2. Core: persistent conversations, server-side OpenAI-compatible adapter, truthful configuration status, preferences and notifications.
3. Documents: safe ingestion, immutable originals/versions, extraction, permission-filtered search, citations, real format exports and approvals.
4. Projects: membership, tasks, task history, internal meetings and manual transcripts.
5. Assistant: actual task dashboard, validated commands, translated navigation and capability status.
6. Advanced: synthetic outreach simulation, integration status, analytics, audit and worker.
7. Verification: pytest access/workflow tests, frontend type/lint/build, Playwright workflows, documentation, secret review and GitHub push.

## Initial environment
- Existing remote main has one README-only commit; preserve its history.
- Python 3.13 and Node 22 available. Docker and GitHub CLI are absent.
- GitHub connector confirms push access; existing destination is public.
- No AI, speech, telephony, WhatsApp, calendar, email, government-system or S3 credentials supplied.
- External services must remain unconfigured; local outreach must remain a labelled simulation.

## Delivery scope

This delivery is a working full-stack MVP with verified local workflows. **The complete master-prompt backlog is not finished. No phase is declared fully complete where an acceptance gate is unverified.** Source is intended for the user-authorised existing repository, preserving its initial commit and visibility.

## Feature-by-feature report

| Feature | Status | Evidence / limit |
| --- | --- | --- |
| Next.js App Router / TypeScript / React / Tailwind | Implemented and tested | Next.js 16.4.6 production build and four browser workflows |
| shadcn-style accessible button / Lucide / Query / Hook Form / Zod | Implemented and tested | Real imports used in functional forms, data loading and shell |
| FastAPI / Pydantic / SQLAlchemy | Implemented and tested | Local API integration tests |
| Alembic initial schema snapshot | Implemented and tested | Local SQLite upgrade/current/check; PostgreSQL gate in CI |
| PostgreSQL + pgvector storage | Implemented but not fully tested | Native Vector column and migration; host has no PostgreSQL/Docker runtime |
| SQLite local database fallback | Implemented and tested | API and browser tests persist actual records |
| Redis queue/cache | Not implemented | Compose infrastructure only; reminder worker uses DB polling |
| Docker Compose | Implemented but not fully tested | Source configuration and Dockerfiles; Docker unavailable on host |
| Secure login/logout and password hashing | Implemented and tested | scrypt, hashed opaque session token, HttpOnly cookie |
| Explicit fictional demo login | Demo/simulation only | Only demo.invalid accounts; disabled by DEMO_MODE=false |
| Password reset token and session revocation | Implemented and tested | Single-use demo reset token; production email delivery absent |
| Profile name/phone/designation | Implemented and tested | API/UI writes; usage and active sessions available |
| Profile picture and email change | Not implemented | Initials avatar only |
| Role, department, project and document enforcement | Implemented and tested | Cross-department and read-only denial tests; no full role-management UI |
| Passkey/WebAuthn/MFA/SSO | Requires external integration | Explicit unconfigured status; no simulated biometric success |
| Collapsible sidebar, Chat/Work, responsive layout | Implemented and tested | Desktop and mobile browser workflows and screenshots |
| Chat create/list/rename/pin/archive/export | Implemented and tested | Persistent APIs; browser creates chat; retention hold blocks deletion |
| Chat search | Implemented and tested | Local title filter in sidebar; full-message search pending |
| Conversation sharing | Implemented and tested | Existing same-department user, authenticated reads and source permission checks |
| Collaborator email delivery and chat comments | Not implemented | Sharing delivers in-app only; comments/notes UI pending |
| OpenAI-compatible/local model adapter | Implemented but not fully tested | Contract tests substitute provider only in tests; no live model credentials |
| AI streaming / stop / regenerate | Implemented but not fully tested | Buffered upstream completion then NDJSON; browser abort does not guarantee upstream cancellation |
| Chat persistence, Markdown, source attachments, feedback | Implemented and tested | Provider-contract and persistence tests; unconfigured model produces error rather than fake answer |
| Token usage | Implemented and tested | Stores provider-reported counts; no billing/quota service |
| Context management | Implemented and tested | Latest 20 messages plus retrieved passages; advanced summarisation pending |
| Upload, parse and chunk six supported file formats | Implemented and tested | Real parser round-trip tests; 20 MB and archive expansion guards |
| Configurable embedding provider and worker indexing | Implemented and tested | Test-provider indexing and permission-filtered semantic retrieval contract |
| Live embeddings and native vector ANN index | Requires external integration | Credentials unavailable; cosine ranking is in-memory, no ANN index |
| Lexical multilingual text fallback | Implemented and tested | Unicode token search with explicit mode; language relevance benchmarking pending |
| Source document/version/page/passage metadata | Implemented and tested | Retrieval contract verifies real document IDs; UI exposes passages/version downloads |
| Live model citation quality | Requires external integration | Needs configured model evaluation; no claim that model prose is always grounded |
| My/shared/department file views | Implemented and tested | Permission-filtered API; frontend filters visible documents |
| Original immutability, checksums and version history | Implemented and tested | Original download unchanged after revision; unique storage/version keys |
| Text comparison of extracted versions | Implemented and tested | Added/removed line diff; not structural/layout comparison |
| Tags, document sharing and visibility | Implemented and tested | Real persisted metadata/read shares; group/revoke UI pending |
| Real DOCX/PDF/XLSX/PPTX/TXT/CSV draft export | Implemented and tested | Real file signatures and parsed facts; spreadsheet formula safeguards |
| Official letter/note/memo/circular/notice/report/minutes/RTI templates | Implemented and tested | Generic facts-only renderer with draft label; specialised legal/department templates pending |
| Scanned-document OCR/digitisation | Requires external integration | Text extraction works; OCR explicitly unconfigured |
| Unicode document text | Implemented but not fully tested | Unicode storage/DOCX input; Assamese/Hindi PDF requires font/shaping verification |
| Local storage | Implemented and tested | Immutable create-only version writes and protected downloads |
| S3-compatible storage | Implemented but not fully tested | Real boto3 adapter; no bucket/credentials supplied |
| Projects create/edit/archive and existing-user members | Implemented and tested | API and browser create/add-member workflows |
| Project groups, member removal/role editor, discussions | Not implemented | Membership model exists; advanced management pending |
| Task create/edit/assignment/status/priority/due dates/history | Implemented and tested | API and browser workflows with membership enforcement |
| Task attachment/comment management | Not implemented | Project file organisation and threaded comments pending |
| Persistent reminders / worker | Implemented and tested | Delivery-once test; worker must be running |
| Internal meeting calendar and manual HTTPS link | Implemented and tested | Persisted entries and timezone conversion; no month-grid view |
| Manual meeting transcripts and recording consent | Implemented and tested | Consent enforcement test; per-project access |
| Audio upload/transcription/speaker labels | Requires external integration | Speech provider not configured; manual transcript fallback available |
| AI meeting summaries/action-item extraction | Not implemented | Can use configured chat manually; no automated meeting pipeline |
| Google Calendar/Meet/Zoom scheduling | Requires external integration | Internal calendar/manual links only; no external scheduling claim |
| Personal dashboard and task status/priority views | Implemented and tested | Actual DB counts and Recharts task chart |
| Structured assistant commands and confirmation | Implemented and tested | Pending list, UTC daily summary, confirmed priority change; natural-language tool routing pending |
| English/Assamese/Hindi primary navigation | Implemented and tested | Translation module, persisted preference; browser Assamese switch |
| Complete UI localisation | Not implemented | Secondary labels/descriptions remain English; native-language review needed |
| Voice input/synthesis / tested Assamese speech | Requires external integration | Not configured or verified; never inferred from language dropdown |
| Tool discovery/search/pins/preferences/theme | Implemented and tested | DB-backed preferences; most-used view currently shows explicitly labelled pinned shortcuts |
| Shortcut reorder, usage-based ranking, integration enable/disable | Not implemented | No pretend provider activation |
| Outreach campaign and synthetic consented contacts | Demo/simulation only | Local simulation records events without external contact |
| Outreach activity and CSV report | Demo/simulation only | API/browser simulator tests; synthetic feedback explicitly labelled |
| Live telephony/WhatsApp and sentiment model | Requires external integration | No sending adapter/credentials; sentiment says not analysed |
| eOffice/legacy sample connectors | Demo/simulation only | Admin-only local samples, audit event and external_connection=false |
| Live eOffice/NIC/legacy credential and sync management | Requires external integration | No authorised government APIs assumed; durable config/sync UI pending |
| Notifications/count/read/navigation/preferences | Implemented and tested | User-scoped in-app notifications and approval browser workflow; no email |
| Human approval/version binding/audit events | Implemented and tested | Distinct role-qualified reviewer, pending-state locks, resolve-once test |
| Reusable arbitrary multi-step workflow designer / resume jobs | Not implemented | Document state engine and actual Work operations only |
| Analytics and authorised audit view | Implemented and tested | Actual permission-filtered database counts; not fabricated live government data |
| Retention hold safeguards | Implemented and tested | Chat deletion denied, originals never exposed to destructive API |
| Configurable disappearing chats / legal retention administration | Not implemented | Holds on by default; automatic deletion disabled |
| Input/file/origin checks, rate limit, security headers | Implemented and tested | API origin checks and validation tests; production hardening in SECURITY.md |
| Independent security/load/accessibility certification | Not implemented | MVP verification is not certification |
| GitHub Actions | Implemented but not fully tested | SQLite/PostgreSQL, frontend and Chromium jobs configured; no remote run/status returned at the initial post-push check |

## Verification record

- Python 3.13.5 and Node 22.15.1 on Windows.
- Backend: **20 tests passed** in the final local run, including workflow, permission, metadata, session, reminder, embedding contract and export-safety tests.
- Ruff: formatting and lint passed.
- SQLite migration upgrade/current/check passed; no schema drift detected.
- Frontend TypeScript, ESLint and production build passed on **Next.js 16.4.6**.
- Production dependency audit initially found a high PostCSS advisory in Next.js 15; upgraded to 16.4.6. Final `npm audit --omit=dev --audit-level=high`: **zero vulnerabilities** at verification time.
- Chromium: **four browser tests passed** after the upgrade (core persistent workflow, membership, human approval, mobile navigation).
- Desktop/mobile screenshots inspected locally. Generated screenshots and test databases are ignored.
- Known test warning: FastAPI/Starlette recommends the newer httpx2 test backend; tests pass with the pinned httpx compatibility backend.
- Docker unavailable; Compose YAML parsed with all five services, but builds/startup are unverified locally. PostgreSQL verification is configured in GitHub Actions.
- Staged credential-pattern scan and Git whitespace review passed for application source; no uploads, databases, keys or local tool downloads are staged.
- No live AI/embedding/speech/S3/government/outreach/calendar provider was verified.

## Master acceptance tests

| Acceptance | Result |
| --- | --- |
| 1 chat login/create | Passed locally |
| 2 real model response | Provider contract passed; live provider unavailable |
| 3 project/member | Passed API + browser |
| 4 assignment | Passed API |
| 5 task status | Passed API |
| 6 upload | Passed API + browser |
| 7 uploaded text search | Passed API + browser |
| 8 grounded answer/citation | Test-provider contract passed; live model evaluation pending |
| 9 office note export | Passed real format generation + browser |
| 10 revision preserves original | Passed API + browser |
| 11 reviewer notification | Passed API + browser |
| 12 supervisor approval | Passed API + browser |
| 13 history | Passed API + browser |
| 14 language change | Passed browser |
| 15 outreach simulator | Passed API + browser; simulation only |
| 16 cross-department denial | Passed API |
| 17 authorised audit | Passed API |
| 18 refresh persistence | Passed browser |
| 19 supported runtime errors | No pageerrors in tested primary browser flow; four browser tests passed |
| 20 fresh checkout startup | Dependency locks and instructions supplied; local build/migration verified, Docker/fresh-machine gate pending |

## Next incomplete work

1. Verify remote CI when GitHub reports a run; initial connector queries returned no runs or commit statuses.
2. Verify full Compose startup and PostgreSQL concurrency/pgvector semantics on a Docker-equipped host.
3. Configure authorised live AI/embedding providers and evaluate grounding, multilingual text and failure/cancellation behavior.
4. Implement project groups/discussions, member role management, task attachments/comments and conversation notes.
5. Add voice/OCR/audio ingestion, authorised external integrations and secure provider configuration workflows only with suitable credentials.
6. Complete localisation, advanced workflow resume, retention policy administration and remaining UI scope.
7. Complete production security/identity/audit/storage/backup requirements before any sensitive deployment.

## GitHub delivery record

- Destination: https://github.com/slevel7/BrahmaGPT-D-36
- Branch: `main`; original remote history preserved, no force push.
- Application milestone: `56673cf`.
- Tests/deployment/documentation milestone: `c31acea`.
- Both milestones successfully pushed using Git's existing credential manager.
- GitHub CLI was downloaded into ignored `.local` tools but is not authenticated. No token was requested or stored in source. The connected GitHub app confirmed repository push permission and was used for read-only status checks.
- Repository was already public; its visibility was not changed.
- Local working tree was clean after the implementation push. This record is a documentation follow-up.
