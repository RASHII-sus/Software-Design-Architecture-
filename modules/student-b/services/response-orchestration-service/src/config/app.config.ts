// services/response-orchestration-service/src/config/app.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3003', 10),
  apiKeySecret: process.env.API_KEY_SECRET ?? 'dev-secret',
  threatIntelServiceUrl: process.env.THREAT_INTEL_SERVICE_URL ?? 'http://localhost:3002',
  requireApprovalForCritical: process.env.REQUIRE_APPROVAL_FOR_CRITICAL === 'true',
  autoRollbackOnFailure: process.env.AUTO_ROLLBACK_ON_FAILURE !== 'false',
}));
