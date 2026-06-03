import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
export declare class HealthController {
    private readonly health;
    private readonly db;
    private readonly config;
    constructor(health: HealthCheckService, db: TypeOrmHealthIndicator, config: ConfigService);
    check(): Promise<import("@nestjs/terminus").HealthCheckResult>;
}
