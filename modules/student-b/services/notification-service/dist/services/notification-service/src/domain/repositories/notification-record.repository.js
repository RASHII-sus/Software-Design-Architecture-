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
exports.NotificationRecordRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const notification_record_entity_1 = require("../entities/notification-record.entity");
const enums_1 = require("../../../../../shared/contracts/enums");
let NotificationRecordRepository = class NotificationRecordRepository {
    constructor(repo) {
        this.repo = repo;
    }
    async create(data) {
        const entity = this.repo.create(data);
        return this.repo.save(entity);
    }
    async markSent(id, messageId) {
        await this.repo.update(id, {
            status: enums_1.NotificationStatus.SENT,
            sentAt: new Date(),
            metadata: messageId ? { messageId } : {},
        });
    }
    async markFailed(id, error, attempts) {
        await this.repo.update(id, {
            status: attempts >= 3 ? enums_1.NotificationStatus.FAILED : enums_1.NotificationStatus.RETRYING,
            lastError: error,
            attempts,
        });
    }
    async findByChannel(channel, limit = 50) {
        return this.repo.find({
            where: { channel },
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }
    async findByStatus(status, limit = 50) {
        return this.repo.find({
            where: { status },
            order: { createdAt: 'ASC' },
            take: limit,
        });
    }
    async countByStatus() {
        const rows = await this.repo
            .createQueryBuilder('n')
            .select('n.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .groupBy('n.status')
            .getRawMany();
        return rows.reduce((acc, row) => {
            acc[row.status] = parseInt(row.count, 10);
            return acc;
        }, {});
    }
};
exports.NotificationRecordRepository = NotificationRecordRepository;
exports.NotificationRecordRepository = NotificationRecordRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(notification_record_entity_1.NotificationRecordEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], NotificationRecordRepository);
//# sourceMappingURL=notification-record.repository.js.map