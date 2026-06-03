// services/threat-intel-service/src/config/redis.module.ts

import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis => {
        const client = new Redis({
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
          password: config.get<string>('redis.password'),
          retryStrategy: (times: number) => Math.min(times * 100, 3000),
          enableOfflineQueue: false,
          lazyConnect: false,
        });

        client.on('connect', () => {
          console.log('[RedisModule] Connected to Redis');
        });
        client.on('error', (err: Error) => {
          console.error('[RedisModule] Redis error:', err.message);
        });

        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
