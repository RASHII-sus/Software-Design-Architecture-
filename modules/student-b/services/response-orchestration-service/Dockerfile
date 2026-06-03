# ─── Build Stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app/services/response-orchestration-service

COPY services/response-orchestration-service/package*.json ./
RUN npm ci --frozen-lockfile

COPY services/response-orchestration-service/tsconfig*.json ./
COPY services/response-orchestration-service/src/ ./src/
COPY shared /app/shared

RUN npm run build

# ─── Production Stage ─────────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app/services/response-orchestration-service

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

COPY services/response-orchestration-service/package*.json ./
RUN npm ci --frozen-lockfile --omit=dev && npm cache clean --force

COPY --from=builder /app/services/response-orchestration-service/dist ./dist
COPY --from=builder /app/shared /app/shared

USER nestjs

EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3003/api/v1/health || exit 1

CMD ["node", "dist/services/response-orchestration-service/src/main.js"]
