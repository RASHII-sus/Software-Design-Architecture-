// services/notification-service/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';
import { NotificationModule } from './notification.module';
import { NotificationRecordEntity } from './domain/entities/notification-record.entity';
import { HealthController } from './controllers/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('POSTGRES_HOST', 'localhost'),
        port: config.get<number>('POSTGRES_PORT', 5432),
        username: config.get('POSTGRES_USER', 'sdapro'),
        password: config.get('POSTGRES_PASSWORD', 'sdapro_secret'),
        database: config.get('POSTGRES_DB', 'sdapro'),
        entities: [NotificationRecordEntity],
        synchronize: false,
      }),
    }),
    TerminusModule,
    NotificationModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
