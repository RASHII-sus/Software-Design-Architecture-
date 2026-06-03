// services/threat-intel-service/src/dto/bulk-check-reputation.dto.ts

import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IndicatorType, ThreatIntelSource } from '../../../../shared/contracts/enums';

export class IndicatorItem {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  indicator: string;

  @ApiProperty({ enum: IndicatorType })
  @IsEnum(IndicatorType)
  indicatorType: IndicatorType;
}

export class BulkCheckReputationDto {
  @ApiProperty({ type: [IndicatorItem], maxItems: 50 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => IndicatorItem)
  indicators: IndicatorItem[];

  @ApiPropertyOptional({ enum: ThreatIntelSource })
  @IsOptional()
  @IsEnum(ThreatIntelSource)
  source?: ThreatIntelSource;
}
