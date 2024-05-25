import { ExecutionContext } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { AuthenticationGuard } from '../authentication.guard'
import { UserService } from '../../../modules/user/user.service'

describe('AuthenticationGuard', () => {
    let guard: AuthenticationGuard
    let mockConfigServiceGetOrThrowFn: jest.Mock
    let mockFindById: jest.Mock

    beforeEach(async () => {
        mockConfigServiceGetOrThrowFn = jest.fn()
        mockFindById = jest.fn()
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthenticationGuard,
                {
                    provide: UserService,
                    useValue: {
                        findById: mockFindById,
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        getOrThrow: mockConfigServiceGetOrThrowFn,
                    },
                },
            ],
        }).compile()
        guard = module.get(AuthenticationGuard)
    })

    it('should be defined', () => {
        expect(guard).toBeDefined()
    })

    it('should throw an error if header is missing', async () => {
        mockConfigServiceGetOrThrowFn.mockReturnValueOnce('true')
        await expect(
            guard.canActivate({
                switchToHttp: () => ({
                    getRequest: () => ({
                        headers: {},
                    }),
                }),
            } as ExecutionContext),
        ).rejects.toThrow('Unauthorized')
        expect(mockFindById).not.toHaveBeenCalled()
    })

    it('should throw an error if format of header is invalid', async () => {
        mockConfigServiceGetOrThrowFn.mockReturnValueOnce('true')
        await expect(
            guard.canActivate({
                switchToHttp: () => ({
                    getRequest: () => ({
                        headers: {
                            authorization: 'some-token',
                        },
                    }),
                }),
            } as ExecutionContext),
        ).rejects.toThrow('Unauthorized')
        expect(mockFindById).not.toHaveBeenCalled()
    })
})
