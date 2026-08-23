# ─── Backend: Node.js + Express (API) ─────────────────────────
FROM node:22-alpine

WORKDIR /app

# Только production-зависимости + tsx для запуска TS
COPY package.json package-lock.json* bun.lock* ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
RUN npm install -g tsx

# Серверный код
COPY server/ ./server/

# Директория для загрузок
RUN mkdir -p uploads

# Не-root пользователь
RUN addgroup -S app && adduser -S app -G app
RUN chown -R app:app /app
USER app

EXPOSE 4000

# Seed мастер-админа + запуск API
CMD ["sh", "-c", "tsx server/db/seed.ts 2>/dev/null; tsx server/index.ts"]
