// services/response-orchestration-service/src/dto/assess-and-respond.dto.ts

import {
  IsString, IsNotEmpty, IsEnum, IsArray, IsBoolean,
  IsOptional, ValidateNested, IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Severity, IncidentState } from '../../../../shared/contracts/enums';

export class TargetAssetDto {
  @ApiPropertyOptional() @IsOptional() @IsString() assetId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() hostname?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ipAddress?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() userId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() filePath?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() fileHash?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() domain?: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() metadata?: Record<string, unknown>;
}

export class AssessAndRespondDto {
  @ApiProperty({ description: 'Incident ID to respond to' })
  @IsString() @IsNotEmpty()
  incidentId: string;

  @ApiProperty({ enum: Severity })
  @IsEnum(Severity)
  severity: Severity;

  @ApiProperty({ enum: IncidentState })
  @IsEnum(IncidentState)
  incidentState: IncidentState;

  @ApiProperty({ enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] })
  @IsEnum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])
  assetCriticality: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

  @ApiProperty({ type: [TargetAssetDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => TargetAssetDto)
  targetAssets: TargetAssetDto[];

  @ApiPropertyOptional() @IsOptional() @IsString()
  analystId?: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  autoResponse?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsString()
  businessContext?: string;
}
