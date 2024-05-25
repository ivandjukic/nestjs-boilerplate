import { SetMetadata } from '@nestjs/common'
import { AUDIT_LOG_ACTION_NAME_METADATA_KEY, AuditLogActionName } from '../enums/AuditLogActionName'

export const SetAuditLogActionName = (actionName: AuditLogActionName, requestParamsToTrack: string[] = []) => {
    return SetMetadata(AUDIT_LOG_ACTION_NAME_METADATA_KEY, { actionName, requestParamsToTrack })
}
