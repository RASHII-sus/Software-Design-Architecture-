// services/threat-intel-service/src/config/app.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3002', 10),
  apiKeySecret: process.env.API_KEY_SECRET ?? 'dev-secret',
}));
