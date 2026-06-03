// middleware/src/pipeline/pipeline.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

// Handlers — PATTERN: Chain of Responsibility
import { DeduplicationHandler } from '../handlers/deduplication.handler';
import { GeoIPHandler } from '../handlers/geo-ip.handler';
import { ThreatIntelHandler } from '../handlers/threat-intel.handler';
import { ClassificationHandler } from '../handlers/classification.handler';

// Pipeline
import { PipelineAssembler } from './pipeline.assembler';
import { PipelineController } from './pipeline.controller';
import { PipelineEventConsumer } from '../events/pipeline-event.consumer';
import { PipelineEventPublisher } from '../events/pipeline-event.publisher';

@Module({
  imports: [ConfigModule, HttpModule],
  controllers: [PipelineController],
  providers: [
    // PATTERN: Chain of Responsibility — all handlers registered as providers
    DeduplicationHandler,
    GeoIPHandler,
    ThreatIntelHandler,
    ClassificationHandler,

    // Assembler links the chain and exposes process()
    PipelineAssembler,

    // Event infrastructure
    PipelineEventConsumer,
    PipelineEventPublisher,
  ],
  exports: [PipelineAssembler],
})
export class PipelineModule {}
