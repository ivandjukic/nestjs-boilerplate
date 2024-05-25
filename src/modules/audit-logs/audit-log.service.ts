import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AuditLogEntity } from './entities/audit-log.entity'
import { SaveAuditLogData } from './types/SaveAuditLogData'

@Injectable()
export class AuditLogService {
    constructor(
        @InjectRepository(AuditLogEntity)
        private readonly repository: Repository<AuditLogEntity>,
    ) {}

    public async save(data: SaveAuditLogData): Promise<void> {
        await this.repository.save({
            action: data.actionName,
            status_code: data.statusCode,
            ip: data.ip,
            user_id: data.userId,
            error: data.error,
            parameters: data.parameters,
        })
    }

    public async getAll(): Promise<AuditLogEntity[]> {
        return this.repository.find({ order: { created_at: 'ASC' } })
    }
}
