# Contributing

Use fictional records. Do not upload government files, citizen details, API keys, tokens or private generated documents to GitHub.

Create a branch from the current main, implement a coherent change and run backend tests/lint plus frontend types/lint/build. Add workflow/access tests for significant behavior and run Playwright for user flow changes. Keep external adapters honest about availability. Preserve immutable originals, source permission checks and human approval boundaries.

Before committing, review staged diffs and run `python scripts/secret_scan.py`. This heuristic does not replace manual review. Do not force-push or overwrite unrelated history. For schema changes, create a new Alembic revision; never silently rewrite existing migrations. Document verified, simulated, untested and pending capabilities in IMPLEMENTATION_STATUS.md.
