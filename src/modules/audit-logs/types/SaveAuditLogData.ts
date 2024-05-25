import { AuditLogActionName } from '../../../common/enums/AuditLogActionName'

export interface SaveAuditLogData {
    actionName: AuditLogActionName
    ip: string
    statusCode: number
    error?: string
    userId?: string
    resourceId?: string
    parameters?: Record<string, any>
}
