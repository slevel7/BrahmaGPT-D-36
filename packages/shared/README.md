# Cross-service contract

FastAPI OpenAPI is the canonical runtime contract (`/openapi.json`). Frontend request helpers use the same-origin `/api` proxy and `X-Brahma-Client: web` for mutations. Pydantic schemas define accepted payloads. A generated TypeScript OpenAPI client remains future work; frontend record views currently use flexible record types.
