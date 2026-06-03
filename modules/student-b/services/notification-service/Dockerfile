FROM node:20-alpine AS builder
WORKDIR /app/services/notification-service
COPY services/notification-service/package*.json ./
RUN npm ci --frozen-lockfile
COPY services/notification-service/tsconfig*.json ./
COPY services/notification-service/src/ ./src/
COPY shared /app/shared
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app/services/notification-service
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
COPY services/notification-service/package*.json ./
RUN npm ci --frozen-lockfile --omit=dev && npm cache clean --force
COPY --from=builder /app/services/notification-service/dist ./dist
COPY --from=builder /app/shared /app/shared
USER nestjs
EXPOSE 3004
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3004/api/v1/health || exit 1
CMD ["node", "dist/services/notification-service/src/main.js"]
