# ─── Build Stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app/middleware

COPY middleware/package*.json ./
RUN npm ci --frozen-lockfile

COPY middleware/tsconfig*.json ./
COPY middleware/src/ ./src/
COPY shared /app/shared

RUN npm run build

# ─── Production Stage ─────────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app/middleware

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

COPY middleware/package*.json ./
RUN npm ci --frozen-lockfile --omit=dev && npm cache clean --force

COPY --from=builder /app/middleware/dist ./dist
COPY --from=builder /app/shared /app/shared

USER nestjs

EXPOSE 3005

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3005/api/v1/health || exit 1

CMD ["node", "dist/middleware/src/main.js"]
