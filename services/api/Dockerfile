FROM python:3.13-slim
WORKDIR /app
COPY services/api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY services/api /app
COPY services/worker /worker
RUN useradd --create-home brahma && mkdir -p /data/files && chown -R brahma:brahma /app /data
USER brahma
EXPOSE 8000
CMD ["sh", "-c", "python -m alembic upgrade head && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"]
