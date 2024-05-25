import { UserEntity } from '../../entities/user.entity'
import { mockOrganizationEntity } from '../../../organization/tests/mocks/mockOrganizationEntity'
import { mockRoleEntity } from '../../../role/tests/mocks/mockRoleEntity'

export const mockUserEntity: UserEntity = {
    id: '022a5af9-0fe5-4403-a336-38e76b1b1d60',
    email: 'email@example.com',
    password: 'password!@#4',
    first_name: 'John',
    last_name: 'Doe',
    organization_id: mockOrganizationEntity.id,
    organization: mockOrganizationEntity,
    created_at: '2024-02-24 23:56:09.499754',
    updated_at: '2024-02-24 23:56:09.499754',
    confirmed_at: '2024-02-24 23:56:09.499754',
    deleted_at: null,
    roles: [mockRoleEntity],
}
