FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/ .

ENV NODE_ENV=production
EXPOSE 8080

CMD ["sh", "-c", "if [ ! -f /data/econofold.duckdb ]; then echo '→ Descargando DB (~2 GB)...'; curl -L --fail -o /tmp/db.tar.gz \"$DB_URL\" && tar -xzf /tmp/db.tar.gz -C /data/ && rm /tmp/db.tar.gz && echo '✓ DB lista'; else echo '✓ DB ya existe'; fi && node server.js"]