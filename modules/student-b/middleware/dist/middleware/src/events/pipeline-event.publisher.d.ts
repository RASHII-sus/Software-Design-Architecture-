import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PipelineResult } from '../handlers/enrichment-handler.abstract';
export declare class PipelineEventPublisher implements OnModuleInit, OnModuleDestroy {
    private readonly config;
    private readonly logger;
    private connection;
    private channel;
    private readonly rabbitmqUrl;
    constructor(config: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    publishAlertEnriched(result: PipelineResult): Promise<void>;
    private connect;
    private publish;
}
