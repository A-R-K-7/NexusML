FROM python:3.11-slim

WORKDIR /app

# System dependencies needed for AutoGluon
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# ── Install Python deps in two stages for better layer caching ──
# Stage 1: heavy base packages (rarely change)
RUN pip install --no-cache-dir \
    numpy==1.26.4 \
    pandas==2.2.2 \
    scikit-learn==1.5.0

# Stage 2: AutoGluon (pinned, cached as its own layer)
RUN pip install --no-cache-dir \
    autogluon.tabular==1.1.1

# Stage 3: light web-framework packages
RUN pip install --no-cache-dir \
    fastapi==0.111.0 \
    "uvicorn[standard]==0.30.1" \
    python-multipart==0.0.9 \
    httpx==0.27.0 \
    "pydantic==2.7.3" \
    python-dotenv==1.0.1

# Copy application code (changes most often — last so cache isn't busted)
COPY . .

# Directories for models and datasets (datasets mounted at runtime via volume)
RUN mkdir -p /app/models /app/uploads

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
