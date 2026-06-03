// middleware/src/pipeline/pipeline.controller.ts

import {
  Controller, Post, Get, Body, HttpCode, HttpStatus, Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PipelineAssembler } from './pipeline.assembler';
import { DeduplicationHandler } from '../handlers/deduplication.handler';
import { CanonicalAlert } from '../../../shared/contracts/interfaces';

class ProcessAlertDto {
  @ApiProperty({ description: 'Canonical alert object to process through the pipeline' })
  @IsObject()
  @IsNotEmpty()
  alert: CanonicalAlert;
}

@ApiTags('pipeline')
@Controller('pipeline')
export class PipelineController {
  private readonly logger = new Logger(PipelineController.name);

  constructor(private readonly assembler: PipelineAssembler) {}

  @Post('process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process a canonical alert through the full enrichment pipeline' })
  @ApiResponse({ status: 200, description: 'Pipeline result with all stage outcomes' })
  async processAlert(@Body() dto: ProcessAlertDto) {
    this.logger.log(`POST /pipeline/process — alertId=${dto.alert.id}`);
    return this.assembler.process(dto.alert);
  }

  @Get('chain')
  @ApiOperation({ summary: 'Get the configured handler chain description' })
  getChain() {
    return {
      pattern: 'Chain of Responsibility',
      handlers: this.assembler.getChainDescription(),
    };
  }

  @Get('dedup/stats')
  @ApiOperation({ summary: 'Get deduplication cache stats' })
  getDedupStats() {
    return {
      cacheSize: DeduplicationHandler.getCacheSize(),
    };
  }
}
