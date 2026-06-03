import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PipelineAssembler } from '../pipeline/pipeline.assembler';
import { PipelineEventPublisher } from './pipeline-event.publisher';
export declare class PipelineEventConsumer implements OnModuleInit, OnModuleDestroy {
    private readonly assembler;
    private readonly publisher;
    private readonly config;
    private readonly logger;
    private connection;
    private channel;
    private readonly rabbitmqUrl;
    constructor(assembler: PipelineAssembler, publisher: PipelineEventPublisher, config: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private connect;
    private handleMessage;
}
