// services/response-orchestration-service/src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { ResponseOrchestrationModule } from './response-orchestration.module';
import { HealthController } from './controllers/health.controller';
import { ResponsePlanEntity } from './domain/entities/response-plan.entity';
import { ResponseActionEntity } from './domain/entities/response-action.entity';
import { ApprovalRequestEntity } from './domain/entities/approval-request.entity';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import rabbitmqConfig from './config/rabbitmq.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, rabbitmqConfig],
      envFilePath: ['.env', '.env.local'],
    }),
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
        entities: [ResponsePlanEntity, ResponseActionEntity, ApprovalRequestEntity],
        synchronize: false,
        logging: config.get<string>('app.nodeEnv') === 'development',
      }),
    }),
    HttpModule,
    TerminusModule,
    ResponseOrchestrationModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
