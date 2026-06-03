// services/threat-intel-service/src/config/redis.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  password: process.env.REDIS_PASSWORD ?? 'redis_secret',
  cacheTtlSeconds: parseInt(process.env.THREAT_INTEL_CACHE_TTL_SECONDS ?? '3600', 10),
}));
