// services/notification-service/src/controllers/notification.controller.ts

import {
  Controller, Post, Get, Body, HttpCode, HttpStatus, Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  IsString, IsNotEmpty, IsEnum, IsOptional, IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  NotificationDispatchService,
} from '../services/notification-dispatch.service';
import { NotificationChannel } from '../../../../shared/contracts/enums';

class DispatchNotificationDto {
  @ApiProperty({ enum: NotificationChannel })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  recipient: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ enum: ['HIGH', 'MEDIUM', 'LOW'] })
  @IsOptional()
  @IsEnum(['HIGH', 'MEDIUM', 'LOW'])
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
}

class IncidentAlertDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  incidentId: string;

  @ApiProperty()
  @IsString()
  severity: string;

  @ApiProperty()
  @IsString()
  description: string;
}

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(private readonly dispatchService: NotificationDispatchService) {}

  @Post('dispatch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dispatch a single notification to specified channel' })
  @ApiResponse({ status: 200, description: 'Delivery result' })
  async dispatch(@Body() dto: DispatchNotificationDto) {
    this.logger.log(`POST /notifications/dispatch — channel=${dto.channel}, to=${dto.recipient}`);
    return this.dispatchService.dispatch(dto);
  }

  @Post('incident-alert')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send incident alert across all available channels' })
  async sendIncidentAlert(@Body() dto: IncidentAlertDto) {
    this.logger.log(`POST /notifications/incident-alert — incidentId=${dto.incidentId}`);
    return this.dispatchService.sendIncidentAlert(
      dto.incidentId,
      dto.severity,
      dto.description,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get notification delivery statistics' })
  async getStats() {
    return this.dispatchService.getStats();
  }

  @Get('tier')
  @ApiOperation({ summary: 'Get current notification factory tier' })
  getTier() {
    return {
      tier: this.dispatchService.getFactoryTier(),
      description:
        this.dispatchService.getFactoryTier() === 'ENTERPRISE'
          ? 'All channels available: Email, Slack, PagerDuty'
          : 'Basic tier: Email only',
    };
  }
}
