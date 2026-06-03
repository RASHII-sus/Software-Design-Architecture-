import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ActionOutcome } from '../../../../shared/contracts/interfaces';
export declare class ResponseOrchestrationEventPublisher implements OnModuleInit, OnModuleDestroy {
    private readonly config;
    private readonly logger;
    private connection;
    private channel;
    private readonly rabbitmqUrl;
    constructor(config: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    publishResponseActionExecuted(incidentId: string, responsePlanId: string, actions: ActionOutcome[], strategyUsed: string): Promise<void>;
    private connect;
    private publish;
    private disconnect;
}
