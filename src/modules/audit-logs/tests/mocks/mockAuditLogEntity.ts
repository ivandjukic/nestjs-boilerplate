import { AuditLogEntity } from '../../entities/audit-log.entity'
import { AuditLogActionName } from '../../../../common/enums/AuditLogActionName'
import { mockUserEntity } from '../../../user/tests/mocks/mockUserEntity'

export const mockAuditLogEntity: AuditLogEntity = {
    id: '22555a1f-3a4e-4a7e-aed4-707caf0a61e3',
    ip: '127.0.0.1',
    action: AuditLogActionName.SIGN_UP,
    status_code: 200,
    parameters: { key: 'value' },
    user_id: mockUserEntity.id,
    user: mockUserEntity,
    error: null,
    created_at: '2024-02-24 23:56:09.499754',
}
