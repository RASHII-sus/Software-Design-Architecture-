# ─── Build Stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app/services/threat-intel-service

COPY services/threat-intel-service/package*.json ./
RUN npm ci --frozen-lockfile

COPY services/threat-intel-service/tsconfig*.json ./
COPY services/threat-intel-service/src/ ./src/
# Copy shared contracts at build time
COPY shared /app/shared

RUN npm run build

# ─── Production Stage ─────────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app/services/threat-intel-service

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

COPY services/threat-intel-service/package*.json ./
RUN npm ci --frozen-lockfile --omit=dev && npm cache clean --force

COPY --from=builder /app/services/threat-intel-service/dist ./dist
COPY --from=builder /app/shared /app/shared

USER nestjs

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3002/api/v1/health || exit 1

CMD ["node", "dist/services/threat-intel-service/src/main.js"]
