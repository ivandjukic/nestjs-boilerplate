import { ProjectEntity } from '../../entities/project.entity'
import { mockUserEntity } from '../../../user/tests/mocks/mockUserEntity'

export const mockProjectEntity: ProjectEntity = {
    id: '022a5af9-0fe5-4403-a336-38e76b1b1870',
    user_id: mockUserEntity.id,
    user: mockUserEntity,
    name: 'test',
    description: 'test',
    created_at: '2024-02-24 23:56:09.499754',
    updated_at: '2024-02-24 23:56:09.499754',
}
