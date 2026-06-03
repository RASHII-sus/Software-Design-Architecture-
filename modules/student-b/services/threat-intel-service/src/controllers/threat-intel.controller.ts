// services/threat-intel-service/src/controllers/threat-intel.controller.ts

import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { ThreatIntelService } from '../services/threat-intel.service';
import { CheckReputationDto } from '../dto/check-reputation.dto';
import { BulkCheckReputationDto } from '../dto/bulk-check-reputation.dto';
import { IndicatorType, ThreatIntelSource } from '../../../../shared/contracts/enums';

@ApiTags('threat-intel')
@ApiSecurity('api-key')
@Controller('threat-intel')
export class ThreatIntelController {
  private readonly logger = new Logger(ThreatIntelController.name);

  constructor(private readonly threatIntelService: ThreatIntelService) {}

  @Post('reputation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check reputation of a single indicator' })
  @ApiResponse({ status: 200, description: 'Reputation result returned' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async checkReputation(@Body() dto: CheckReputationDto) {
    this.logger.log(`POST /threat-intel/reputation — ${dto.indicatorType}:${dto.indicator}`);
    return this.threatIntelService.checkReputation(dto);
  }

  @Post('reputation/bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check reputation of multiple indicators (max 50)' })
  @ApiResponse({ status: 200, description: 'Array of reputation results' })
  async bulkCheckReputation(@Body() dto: BulkCheckReputationDto) {
    this.logger.log(`POST /threat-intel/reputation/bulk — ${dto.indicators.length} indicators`);
    return this.threatIntelService.bulkCheckReputation(dto);
  }

  @Get('indicators/:indicator/history')
  @ApiOperation({ summary: 'Get stored history for an indicator' })
  @ApiResponse({ status: 200, description: 'Historical reputation data' })
  async getIndicatorHistory(
    @Param('indicator') indicator: string,
    @Query('source') source?: ThreatIntelSource,
  ) {
    return this.threatIntelService.getIndicatorHistory(indicator, source);
  }

  @Get('indicators/malicious')
  @ApiOperation({ summary: 'Get known malicious indicators' })
  async getMaliciousIndicators(@Query('limit') limit?: number) {
    return this.threatIntelService.getMaliciousIndicators(limit ? Number(limit) : 50);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get cache and verdict statistics' })
  async getStats() {
    return this.threatIntelService.getStats();
  }

  @Delete('cache/:indicatorType/:indicator')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Invalidate cache for a specific indicator' })
  async invalidateCache(
    @Param('indicator') indicator: string,
    @Param('indicatorType') indicatorType: IndicatorType,
  ) {
    await this.threatIntelService.invalidateCache(indicator, indicatorType);
  }
}
