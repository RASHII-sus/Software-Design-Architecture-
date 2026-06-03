import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ReputationResult } from '../../../../shared/contracts/interfaces';
export declare class ThreatIntelEventPublisher implements OnModuleInit, OnModuleDestroy {
    private readonly config;
    private readonly logger;
    private connection;
    private channel;
    private readonly rabbitmqUrl;
    constructor(config: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    publishThreatIntelUpdated(result: ReputationResult): Promise<void>;
    private connect;
    private publish;
    private disconnect;
}
