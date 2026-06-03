// services/response-orchestration-service/src/config/rabbitmq.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('rabbitmq', () => ({
  url: process.env.RABBITMQ_URL ?? 'amqp://sdapro:rabbitmq_secret@localhost:5672/sdapro',
}));
