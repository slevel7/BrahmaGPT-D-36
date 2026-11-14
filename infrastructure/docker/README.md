# Containers

The root Compose file is the local demonstration stack. PostgreSQL+pgvector and file versions use named volumes. API runs Alembic before Uvicorn; worker waits for API health. Only the loopback web port is published. Default database password is for local use only. Redis is reserved infrastructure, not an active queue yet. Verify container builds on a Docker-equipped host; the authoring host has no Docker executable.
