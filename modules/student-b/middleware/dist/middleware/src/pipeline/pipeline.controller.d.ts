import { PipelineAssembler } from './pipeline.assembler';
import { CanonicalAlert } from '../../../shared/contracts/interfaces';
declare class ProcessAlertDto {
    alert: CanonicalAlert;
}
export declare class PipelineController {
    private readonly assembler;
    private readonly logger;
    constructor(assembler: PipelineAssembler);
    processAlert(dto: ProcessAlertDto): Promise<import("../handlers/enrichment-handler.abstract").PipelineResult>;
    getChain(): {
        pattern: string;
        handlers: string[];
    };
    getDedupStats(): {
        cacheSize: number;
    };
}
export {};
