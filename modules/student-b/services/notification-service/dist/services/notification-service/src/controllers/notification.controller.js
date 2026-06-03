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
var NotificationController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_2 = require("@nestjs/swagger");
const notification_dispatch_service_1 = require("../services/notification-dispatch.service");
const enums_1 = require("../../../../shared/contracts/enums");
class DispatchNotificationDto {
}
__decorate([
    (0, swagger_2.ApiProperty)({ enum: enums_1.NotificationChannel }),
    (0, class_validator_1.IsEnum)(enums_1.NotificationChannel),
    __metadata("design:type", String)
], DispatchNotificationDto.prototype, "channel", void 0);
__decorate([
    (0, swagger_2.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], DispatchNotificationDto.prototype, "recipient", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DispatchNotificationDto.prototype, "subject", void 0);
__decorate([
    (0, swagger_2.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], DispatchNotificationDto.prototype, "body", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], DispatchNotificationDto.prototype, "metadata", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ enum: ['HIGH', 'MEDIUM', 'LOW'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['HIGH', 'MEDIUM', 'LOW']),
    __metadata("design:type", String)
], DispatchNotificationDto.prototype, "priority", void 0);
class IncidentAlertDto {
}
__decorate([
    (0, swagger_2.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], IncidentAlertDto.prototype, "incidentId", void 0);
__decorate([
    (0, swagger_2.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IncidentAlertDto.prototype, "severity", void 0);
__decorate([
    (0, swagger_2.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IncidentAlertDto.prototype, "description", void 0);
let NotificationController = NotificationController_1 = class NotificationController {
    constructor(dispatchService) {
        this.dispatchService = dispatchService;
        this.logger = new common_1.Logger(NotificationController_1.name);
    }
    async dispatch(dto) {
        this.logger.log(`POST /notifications/dispatch — channel=${dto.channel}, to=${dto.recipient}`);
        return this.dispatchService.dispatch(dto);
    }
    async sendIncidentAlert(dto) {
        this.logger.log(`POST /notifications/incident-alert — incidentId=${dto.incidentId}`);
        return this.dispatchService.sendIncidentAlert(dto.incidentId, dto.severity, dto.description);
    }
    async getStats() {
        return this.dispatchService.getStats();
    }
    getTier() {
        return {
            tier: this.dispatchService.getFactoryTier(),
            description: this.dispatchService.getFactoryTier() === 'ENTERPRISE'
                ? 'All channels available: Email, Slack, PagerDuty'
                : 'Basic tier: Email only',
        };
    }
};
exports.NotificationController = NotificationController;
__decorate([
    (0, common_1.Post)('dispatch'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Dispatch a single notification to specified channel' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Delivery result' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [DispatchNotificationDto]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "dispatch", null);
__decorate([
    (0, common_1.Post)('incident-alert'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Send incident alert across all available channels' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [IncidentAlertDto]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "sendIncidentAlert", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get notification delivery statistics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('tier'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current notification factory tier' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], NotificationController.prototype, "getTier", null);
exports.NotificationController = NotificationController = NotificationController_1 = __decorate([
    (0, swagger_1.ApiTags)('notifications'),
    (0, common_1.Controller)('notifications'),
    __metadata("design:paramtypes", [notification_dispatch_service_1.NotificationDispatchService])
], NotificationController);
//# sourceMappingURL=notification.controller.js.map