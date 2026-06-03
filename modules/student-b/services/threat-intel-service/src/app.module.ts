// services/threat-intel-service/src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { ThreatIntelModule } from './threat-intel.module';
import { HealthController } from './controllers/health.controller';
import { ThreatIndicatorEntity } from './domain/entities/threat-indicator.entity';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import rabbitmqConfig from './config/rabbitmq.config';
import externalApisConfig from './config/external-apis.config';

@Module({
  imports: [
    // Config — loads all config namespaces, validates env
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, rabbitmqConfig, externalApisConfig],
      envFilePath: ['.env', '.env.local'],
    }),

    // TypeORM — PostgreSQL connection
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.name'),
        entities: [ThreatIndicatorEntity],
        synchronize: false, // use init-db.sql migrations
        logging: config.get<string>('app.nodeEnv') === 'development',
        ssl: config.get<string>('app.nodeEnv') === 'production'
          ? { rejectUnauthorized: false }
          : false,
      }),
    }),

    HttpModule,
    TerminusModule,
    ThreatIntelModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
