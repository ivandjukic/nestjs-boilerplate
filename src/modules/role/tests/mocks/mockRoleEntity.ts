import { RoleEntity } from '../../entities/role.entity'
import { RoleName } from '../../enums/RoleName'
import { mockUserEntity } from '../../../user/tests/mocks/mockUserEntity'

export const mockRoleEntity: RoleEntity = {
    id: 'f4306a8d-21b2-42fe-98d1-df0aed28ee00',
    name: RoleName.ADMIN,
    created_at: '2024-02-25 00:08:02.038231',
    updated_at: '2024-02-25 00:08:02.038231',
    users: [mockUserEntity],
}
