import { Test, TestingModule } from '@nestjs/testing'
import { Reflector } from '@nestjs/core'
import { ExecutionContext } from '@nestjs/common'
import { UserRoleGuard } from '../user-role.guard'
import { mockUserEntity } from '../../../modules/user/tests/mocks/mockUserEntity'
import { RoleName } from '../../../modules/role/enums/RoleName'

describe('UserRoleGuard', () => {
    let userRoleGuard: UserRoleGuard
    let reflector: Reflector

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [UserRoleGuard, Reflector],
        }).compile()

        userRoleGuard = module.get(UserRoleGuard)
        reflector = module.get(Reflector)
    })

    it('should be defined', () => {
        expect(userRoleGuard).toBeDefined()
    })

    it('should throw an error if required role is missing', async () => {
        const mockExecutionContext = {
            getHandler: jest.fn(),
            switchToHttp: () => ({
                getRequest: () => ({
                    user: mockUserEntity,
                }),
            }),
        } as unknown as ExecutionContext

        jest.spyOn(reflector, 'get').mockReturnValueOnce(undefined)
        await expect(userRoleGuard.canActivate(mockExecutionContext)).rejects.toThrow('UserRole is required')
    })

    it('should throw an error if user is missing', async () => {
        const mockExecutionContext = {
            getHandler: jest.fn(),
            switchToHttp: () => ({
                getRequest: () => ({}),
            }),
        } as unknown as ExecutionContext

        jest.spyOn(reflector, 'get').mockReturnValueOnce([RoleName.EDITOR])
        await expect(userRoleGuard.canActivate(mockExecutionContext)).rejects.toThrow('Unauthorized')
    })

    it('should throw an error if user does not have required roles', async () => {
        const mockExecutionContext = {
            getHandler: jest.fn(),
            switchToHttp: () => ({
                getRequest: () => ({
                    user: mockUserEntity,
                }),
            }),
        } as unknown as ExecutionContext

        jest.spyOn(reflector, 'get').mockReturnValueOnce([RoleName.EDITOR])
        await expect(userRoleGuard.canActivate(mockExecutionContext)).rejects.toThrow(
            'User does not have required roles to access this resource.',
        )
    })
})
