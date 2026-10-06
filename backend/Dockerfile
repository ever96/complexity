FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 8080

CMD ["sh", "-c", "if [ ! -f /data/econofold.duckdb ]; then echo '→ Descargando DB (~2 GB)...'; curl -L --fail -o /tmp/db.tar.gz \"$DB_URL\" && echo '→ Descomprimiendo...' && tar -xzf /tmp/db.tar.gz -C /data/ && rm /tmp/db.tar.gz && echo '✓ DB lista'; else echo '✓ DB ya existe'; fi && node server.js"]