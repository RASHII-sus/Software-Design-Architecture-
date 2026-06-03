import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationDispatchService } from '../services/notification-dispatch.service';
export declare class NotificationEventConsumer implements OnModuleInit, OnModuleDestroy {
    private readonly dispatchService;
    private readonly config;
    private readonly logger;
    private connection;
    private channel;
    private readonly rabbitmqUrl;
    constructor(dispatchService: NotificationDispatchService, config: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private connect;
    private handleNotificationDispatch;
    private handleResponseActionExecuted;
}
