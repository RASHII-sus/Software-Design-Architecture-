// services/threat-intel-service/src/config/database.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
  username: process.env.POSTGRES_USER ?? 'sdapro',
  password: process.env.POSTGRES_PASSWORD ?? 'sdapro_secret',
  name: process.env.POSTGRES_DB ?? 'sdapro',
}));
