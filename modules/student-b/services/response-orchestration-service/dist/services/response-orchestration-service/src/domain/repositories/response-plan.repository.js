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
exports.ResponsePlanRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const response_plan_entity_1 = require("../entities/response-plan.entity");
const enums_1 = require("../../../../../shared/contracts/enums");
let ResponsePlanRepository = class ResponsePlanRepository {
    constructor(repo) {
        this.repo = repo;
    }
    async create(data) {
        const entity = this.repo.create(data);
        return this.repo.save(entity);
    }
    async findById(id) {
        return this.repo.findOne({ where: { id }, relations: ['actions'] });
    }
    async findByIncidentId(incidentId) {
        return this.repo.find({
            where: { incidentId },
            relations: ['actions'],
            order: { createdAt: 'DESC' },
        });
    }
    async updateStatus(id, status, completedAt) {
        await this.repo.update(id, {
            status,
            ...(completedAt ? { completedAt } : {}),
        });
    }
    async findActivePlans() {
        return this.repo.find({
            where: [
                { status: enums_1.ResponsePlanStatus.PENDING },
                { status: enums_1.ResponsePlanStatus.IN_PROGRESS },
            ],
            relations: ['actions'],
            order: { createdAt: 'DESC' },
        });
    }
};
exports.ResponsePlanRepository = ResponsePlanRepository;
exports.ResponsePlanRepository = ResponsePlanRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(response_plan_entity_1.ResponsePlanEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ResponsePlanRepository);
//# sourceMappingURL=response-plan.repository.js.map