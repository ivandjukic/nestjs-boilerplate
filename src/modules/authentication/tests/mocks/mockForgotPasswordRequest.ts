import { ForgotPasswordRequestEntity } from '../../../forgot-password/entities/forgot-password.entity'
import { mockUserEntity } from '../../../user/tests/mocks/mockUserEntity'

export const mockForgotPasswordRequest: ForgotPasswordRequestEntity = {
    id: ' 022a5af9-24e5-4403-a336-38e76b1b1d60',
    user_id: mockUserEntity.id,
    user: mockUserEntity,
    hash: 'hash',
    is_valid: true,
    created_at: '2024-02-24 23:56:09.499754',
    updated_at: '2024-02-24 23:56:09.499754',
}
