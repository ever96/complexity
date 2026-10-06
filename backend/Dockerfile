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

CMD ["sh", "-c", "mkdir -p /data && if [ ! -f /data/econofold.duckdb ]; then echo '→ Descargando DB (~2 GB)...'; curl -L --fail -A 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' -H 'Accept: */*' -H 'Accept-Encoding: gzip, deflate, br' -o /tmp/db.tar.gz \"$DB_URL\" && echo '→ Descomprimiendo...' && tar -xzf /tmp/db.tar.gz -C /data/ && rm /tmp/db.tar.gz && echo '✓ DB lista'; else echo '✓ DB ya existe'; fi && node server.js"]