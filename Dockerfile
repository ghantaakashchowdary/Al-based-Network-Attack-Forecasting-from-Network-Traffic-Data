# SentinelAI Production Dockerfile
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8080 \
    GANESH_MODULE_DIR=/app/ganesh_module

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt

# Main API
COPY api.py .

# Existing network forecasting model
COPY src/ ./src/
COPY artifacts/ ./artifacts/
COPY ganesh_module/ ./ganesh_module/
COPY message_ai/ ./message_ai/
COPY security/ ./security/
COPY data/ ./data/

# SentinelAI security modules
COPY security/ ./security/
COPY message_ai/ ./message_ai/

EXPOSE 8080

CMD exec uvicorn api:app --host 0.0.0.0 --port ${PORT:-8080} --workers 1