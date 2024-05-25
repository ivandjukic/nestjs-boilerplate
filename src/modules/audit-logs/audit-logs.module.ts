import { Global, Module } from '@nestjs/common'
import { AuditLogService } from './audit-log.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuditLogEntity } from './entities/audit-log.entity'

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([AuditLogEntity])],
    providers: [AuditLogService],
    exports: [AuditLogService],
})
export class AuditLogsModule {}
