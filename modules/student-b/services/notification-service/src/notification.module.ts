// services/notification-service/src/notification.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

// Entities & Repositories
import { NotificationRecordEntity } from './domain/entities/notification-record.entity';
import { NotificationRecordRepository } from './domain/repositories/notification-record.repository';

// Concrete notifier products — PATTERN: Abstract Factory
import { EmailNotifier } from './services/channels/email.notifier';
import { SlackNotifier } from './services/channels/slack.notifier';
import { PagerDutyNotifier } from './services/channels/pagerduty.notifier';

// Concrete factories
import { EnterpriseNotificationFactory } from './services/factory/enterprise-notification.factory';
import { BasicNotificationFactory } from './services/factory/basic-notification.factory';

// Main service
import {
  NotificationDispatchService,
  NOTIFICATION_FACTORY,
} from './services/notification-dispatch.service';

// Controllers & Events
import { NotificationController } from './controllers/notification.controller';
import { NotificationEventConsumer } from './events/notification-event.consumer';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationRecordEntity]),
    ConfigModule,
    HttpModule,
  ],
  controllers: [NotificationController],
  providers: [
    // Repositories
    NotificationRecordRepository,

    // Concrete notifier products
    EmailNotifier,
    SlackNotifier,
    PagerDutyNotifier,

    // Both concrete factories
    EnterpriseNotificationFactory,
    BasicNotificationFactory,

    // PATTERN: Abstract Factory — dynamically select factory based on NOTIFICATION_TIER env var
    // This is the key factory selection: the rest of the system only sees NOTIFICATION_FACTORY
    {
      provide: NOTIFICATION_FACTORY,
      inject: [ConfigService, EnterpriseNotificationFactory, BasicNotificationFactory],
      useFactory: (
        config: ConfigService,
        enterprise: EnterpriseNotificationFactory,
        basic: BasicNotificationFactory,
      ) => {
        const tier = config.get<string>('NOTIFICATION_TIER', 'BASIC').toUpperCase();
        const factory = tier === 'ENTERPRISE' ? enterprise : basic;
        console.log(`[NotificationModule] Selected factory: ${factory.getTierName()}`);
        return factory;
      },
    },

    // Main dispatch service
    NotificationDispatchService,

    // RabbitMQ consumer
    NotificationEventConsumer,
  ],
  exports: [NotificationDispatchService],
})
export class NotificationModule {}
