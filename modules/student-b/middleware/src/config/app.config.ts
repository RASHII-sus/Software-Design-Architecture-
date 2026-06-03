// middleware/src/config/app.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3005', 10),
  threatIntelServiceUrl: process.env.THREAT_INTEL_SERVICE_URL ?? 'http://localhost:3002',
  apiKeySecret: process.env.API_KEY_SECRET ?? 'dev-secret',
  deduplicationWindowSeconds: parseInt(process.env.DEDUPLICATION_WINDOW_SECONDS ?? '300', 10),
  classificationDefaultSeverity: process.env.CLASSIFICATION_DEFAULT_SEVERITY ?? 'MEDIUM',
}));
