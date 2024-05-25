import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { UserService } from '../../user/user.service'
import { mockUserEntity } from '../../user/tests/mocks/mockUserEntity'
import { UserController } from '../user.controller'

describe('UserController', () => {
    let controller: UserController

    beforeAll(async () => {
        const UserControllerProvider = {
            provide: UserService,
            useFactory: () => ({}),
        }

        const app: TestingModule = await Test.createTestingModule({
            controllers: [UserController],
            providers: [
                UserControllerProvider,
                { provide: UserService, useFactory: () => {} },
                {
                    provide: ConfigService,
                    useFactory: () => {},
                },
            ],
        }).compile()
        controller = app.get(UserController)
    })

    afterEach(() => jest.clearAllMocks())

    it('should be defined', () => {
        expect(controller).toBeDefined()
    })

    describe('signUpRequest', () => {
        it('should return user', async () => {
            const data = await controller.signUpRequest(mockUserEntity)
            expect(data).toEqual({
                id: mockUserEntity.id,
                email: mockUserEntity.email,
                first_name: mockUserEntity.first_name,
                last_name: mockUserEntity.last_name,
                created_at: mockUserEntity.created_at,
                organization: {
                    id: mockUserEntity.organization.id,
                    name: mockUserEntity.organization.name,
                    created_at: mockUserEntity.organization.created_at,
                },
                roles: mockUserEntity.roles.map((role) => role.name),
            })
        })
    })
})
