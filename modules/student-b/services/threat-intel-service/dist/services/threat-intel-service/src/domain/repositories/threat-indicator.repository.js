"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreatIndicatorRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const threat_indicator_entity_1 = require("../entities/threat-indicator.entity");
const enums_1 = require("../../../../../shared/contracts/enums");
let ThreatIndicatorRepository = class ThreatIndicatorRepository {
    constructor(repo) {
        this.repo = repo;
    }
    async findByIndicator(indicator, source) {
        const query = this.repo.createQueryBuilder('ti')
            .where('ti.indicator = :indicator', { indicator });
        if (source) {
            query.andWhere('ti.source = :source', { source });
        }
        return query.orderBy('ti.last_seen', 'DESC').getOne();
    }
    async findAllByIndicatorType(indicatorType, limit = 100) {
        return this.repo.find({
            where: { indicatorType },
            order: { lastSeen: 'DESC' },
            take: limit,
        });
    }
    async findMaliciousIndicators(limit = 50) {
        return this.repo.find({
            where: { verdict: enums_1.Verdict.MALICIOUS },
            order: { reputationScore: 'DESC' },
            take: limit,
        });
    }
    async upsert(dto) {
        const existing = await this.findByIndicator(dto.indicator, dto.source);
        if (existing) {
            existing.verdict = dto.verdict;
            existing.confidenceScore = dto.confidenceScore;
            existing.reputationScore = dto.reputationScore;
            existing.rawResponse = dto.rawResponse ?? null;
            existing.tags = dto.tags ?? [];
            existing.lastSeen = new Date();
            existing.expiresAt = dto.expiresAt ?? null;
            return this.repo.save(existing);
        }
        const entity = this.repo.create({
            ...dto,
            rawResponse: dto.rawResponse ?? null,
            tags: dto.tags ?? [],
            firstSeen: new Date(),
            lastSeen: new Date(),
            expiresAt: dto.expiresAt ?? null,
        });
        return this.repo.save(entity);
    }
    async deleteExpired() {
        const result = await this.repo
            .createQueryBuilder()
            .delete()
            .where('expires_at IS NOT NULL AND expires_at < NOW()')
            .execute();
        return result.affected ?? 0;
    }
    async countByVerdict() {
        const rows = await this.repo
            .createQueryBuilder('ti')
            .select('ti.verdict', 'verdict')
            .addSelect('COUNT(*)', 'count')
            .groupBy('ti.verdict')
            .getRawMany();
        return rows.reduce((acc, row) => {
            acc[row.verdict] = parseInt(row.count, 10);
            return acc;
        }, {});
    }
};
exports.ThreatIndicatorRepository = ThreatIndicatorRepository;
exports.ThreatIndicatorRepository = ThreatIndicatorRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(threat_indicator_entity_1.ThreatIndicatorEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ThreatIndicatorRepository);
//# sourceMappingURL=threat-indicator.repository.js.map