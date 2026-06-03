// middleware/src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { PipelineModule } from './pipeline/pipeline.module';
import { HealthController } from './pipeline/health.controller';
import appConfig from './config/app.config';
import rabbitmqConfig from './config/rabbitmq.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, rabbitmqConfig],
      envFilePath: ['.env', '.env.local'],
    }),
    HttpModule,
    TerminusModule,
    PipelineModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
