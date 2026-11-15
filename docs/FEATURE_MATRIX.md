# Incremental feature matrix

The existing repository is preserved. This branch extends the current FastAPI / Next.js application; it does not complete the entire master specification.

| Capability | Status | Evidence / remaining work |
|---|---|---|
| Existing auth, projects, tasks, uploads, exports, reminders | WORKING locally | Existing regression tests retained |
| Permission-aware lexical retrieval | WORKING | Department and ACL filtering, including derived source dependencies |
| Semantic / hosted model retrieval | REQUIRES CREDENTIALS | Existing provider adapter retained; live quality unverified |
| Grounded drafting | WORKING extractive mode; optional AI selector contract tested | Approved versioned document templates, exact passages, optional policy-gated model selection of existing passage IDs, no generated official references |
| Approved templates | WORKING | Tag document `template`, approve via a different officer, then select for drafting |
| Evidence | WORKING | Version ID/number, checksum, chunk ID, page if paginated; exact source download |
| Recommendations and unsupported claims | WORKING conservative mode | All recommendation text and all manual edits flagged for human verification; no semantic entailment guarantee |
| Immutable edits | WORKING through application | New versions preserve originals and provenance; ORM mutation guards; privileged SQL/storage tampering still requires deployment controls |
| Configurable sequential human approvals | WORKING | Distinct reviewer sequence bound to version; self approval blocked; return/reject/resubmit through existing workflow |
| Audit | WORKING application append-only | ORM guards and decision events; external tamper-resistant sink pending |
| Sidebar / contextual Brahma | WORKING | Five requested entries, avatar menu, contextual chat panel, Outreach inside Department Work |
| Original lotus | NOT IMPLEMENTED | No supplied original asset in repository; current brand retained |
| Profile | PARTIAL | Nine section navigation; contact, sessions, usage/activity, preferences and notifications; access-request, OAuth and support-ticket workflows pending |
| Customize | PARTIAL | Six tabs, persisted favourites and genuine recents, open internal/demo workflows; no live connected tools; grouping/reordering/dismissal pending |
| Department Work | PARTIAL | Existing review/task workspace and outreach simulator retained; configurable Pension / Grievance / Department Tools case engines pending |
| External systems | REQUIRES CREDENTIALS / IMPLEMENTATION | No claim of government portal, WhatsApp, telephony or enterprise OAuth integration |
| Production deployment | NOT VERIFIED | PostgreSQL concurrency, S3, retention privileges, external model policy and security review remain deployment work |

See GROUNDED_DRAFTING.md for operation, tests and limitations.
