// services/threat-intel-service/src/dto/check-reputation.dto.ts

import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IndicatorType, ThreatIntelSource } from '../../../../shared/contracts/enums';

export class CheckReputationDto {
  @ApiProperty({ description: 'The indicator value to check', example: '8.8.8.8' })
  @IsString()
  @IsNotEmpty()
  indicator: string;

  @ApiProperty({ enum: IndicatorType, description: 'Type of the indicator' })
  @IsEnum(IndicatorType)
  indicatorType: IndicatorType;

  @ApiPropertyOptional({ enum: ThreatIntelSource, description: 'Specific source to query' })
  @IsOptional()
  @IsEnum(ThreatIntelSource)
  source?: ThreatIntelSource;
}
