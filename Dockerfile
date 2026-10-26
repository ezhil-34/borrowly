# ==============================================================================
# Borrowly Full-Stack Single Dockerfile (Client + Node Server + Python ML / MLOps)
# ==============================================================================

# --- Stage 1: Build React Client ---
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# --- Stage 2: Final Full-Stack Container with Node.js & Python ML ---
FROM python:3.10-slim

# Install system dependencies & Node.js 20
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    build-essential \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python ML dependencies
COPY ml_project/requirements.txt ./ml_project/requirements.txt
RUN pip install --no-cache-dir -r ./ml_project/requirements.txt \
    fastapi \
    uvicorn \
    requests

# Install Node.js backend dependencies
COPY package*.json ./
RUN npm install

# Copy server, models, ml_project, credentials and built client dist
COPY server/ ./server/
COPY ml_project/ ./ml_project/
COPY serviceAccountKey.json* ./
COPY --from=client-builder /app/client/dist ./client/dist
COPY .env.example ./.env

# Default Environment Variables
ENV PORT=3000 \
    ML_SERVICE_HOST=127.0.0.1 \
    ML_SERVICE_PORT=8000 \
    NODE_ENV=production

# Startup script to run both Python ML microservice and Node.js Gateway
RUN echo '#!/bin/sh\n\
echo "Starting Python ML & MLOps Serving Microservice on port $ML_SERVICE_PORT..."\n\
cd /app/ml_project && uvicorn app:app --host 0.0.0.0 --port $ML_SERVICE_PORT &\n\
echo "Starting Node.js Backend Gateway on port $PORT..."\n\
cd /app && node server/index.js\n\
' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 3000 8000

CMD ["/app/start.sh"]
