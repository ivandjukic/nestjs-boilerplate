import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { UserService } from '../../user/user.service'
import { mockUserEntity } from '../../user/tests/mocks/mockUserEntity'
import { AuthenticationController } from '../authentication.controller'
import { AuthenticationService } from '../authentication.service'
import { AccountVerificationHashExpired } from '../errors/AccountVerificationHashExpired'
import { ForbiddenException, HttpStatus } from '@nestjs/common'
import { AuditLogService } from '../../audit-logs/audit-log.service'

describe('AuthenticationController', () => {
    let controller: AuthenticationController
    let mockSignUpFn: jest.Mock
    let mockConfirmEmailFn: jest.Mock
    let mockSignInFn: jest.Mock
    let mockRefreshTokenFn: jest.Mock
    let mockHandleForgotPasswordRequestFn: jest.Mock
    let mockValidateForgotPasswordRequestHashFn: jest.Mock
    let mockSetNewPasswordFn: jest.Mock
    let mockUpdatePasswordFn: jest.Mock

    const mockResponse = () => {
        const res: any = {}
        res.cookie = jest.fn().mockReturnValue(res)
        res.status = jest.fn().mockReturnValue(res)
        res.json = jest.fn().mockReturnValue(res)
        res.clearCookie = jest.fn().mockReturnValue(res)
        return res
    }

    beforeAll(async () => {
        mockSignUpFn = jest.fn()
        mockConfirmEmailFn = jest.fn()
        mockSignInFn = jest.fn()
        mockRefreshTokenFn = jest.fn()
        mockHandleForgotPasswordRequestFn = jest.fn()
        mockValidateForgotPasswordRequestHashFn = jest.fn()
        mockSetNewPasswordFn = jest.fn()
        mockUpdatePasswordFn = jest.fn()

        const AuthenticationControllerProvider = {
            provide: AuthenticationService,
            useFactory: () => ({
                signUp: mockSignUpFn,
                confirmEmail: mockConfirmEmailFn,
                signIn: mockSignInFn,
                refreshToken: mockRefreshTokenFn,
                handleForgotPasswordRequest: mockHandleForgotPasswordRequestFn,
                validateForgotPasswordRequestHash: mockValidateForgotPasswordRequestHashFn,
                setNewPassword: mockSetNewPasswordFn,
                updatePassword: mockUpdatePasswordFn,
            }),
        }

        const app: TestingModule = await Test.createTestingModule({
            controllers: [AuthenticationController],
            providers: [
                AuthenticationControllerProvider,
                { provide: UserService, useFactory: () => {} },
                {
                    provide: ConfigService,
                    useFactory: () => {},
                },
                {
                    provide: AuditLogService,
                    useFactory: () => ({}),
                },
            ],
        }).compile()
        controller = app.get(AuthenticationController)
    })

    afterEach(() => jest.clearAllMocks())

    it('should be defined', () => {
        expect(controller).toBeDefined()
    })

    describe('signUpRequest', () => {
        it('should sign up', async () => {
            mockSignUpFn.mockResolvedValue(undefined)
            await controller.signUpRequest({
                email: mockUserEntity.email,
                first_name: mockUserEntity.first_name,
                last_name: mockUserEntity.last_name,
                password: mockUserEntity.password,
                organization_name: mockUserEntity.organization.name,
            })
            expect(mockSignUpFn).toHaveBeenCalledWith({
                email: mockUserEntity.email,
                first_name: mockUserEntity.first_name,
                last_name: mockUserEntity.last_name,
                password: mockUserEntity.password,
                organization_name: mockUserEntity.organization.name,
            })
        })
    })

    describe('confirmEmail', () => {
        it('should confirm email', async () => {
            mockConfirmEmailFn.mockResolvedValue(undefined)
            await controller.confirmEmail('hash')
            expect(mockConfirmEmailFn).toHaveBeenCalledWith('hash')
        })
        it('should handle AccountVerificationHashExpired error', async () => {
            mockConfirmEmailFn.mockRejectedValue(new AccountVerificationHashExpired())
            await expect(controller.confirmEmail('hash')).rejects.toThrow(ForbiddenException)
        })
        it('should handle other errors', async () => {
            mockConfirmEmailFn.mockRejectedValue(new Error())
            await expect(controller.confirmEmail('hash')).rejects.toThrow(Error)
        })
    })

    describe('signInRequest', () => {
        it('should sign in successfully', async () => {
            const signInResult = {
                jwtToken: 'some-jwt-token',
                refreshToken: 'some-refresh-token',
                rememberMe: true,
                jwtTokenExpiresIn: 3600,
                refreshTokenExpiresIn: 7200,
            }

            mockSignInFn.mockResolvedValue(signInResult)
            const data = await controller.signInRequest({
                email: mockUserEntity.email,
                password: mockUserEntity.password,
            })

            expect(mockSignInFn).toHaveBeenCalledWith({
                email: mockUserEntity.email,
                password: mockUserEntity.password,
            })
            expect(data).toEqual({
                jwt_token: 'some-jwt-token',
                jwt_token_expires_in: 3600,
                refresh_token: 'some-refresh-token',
                refresh_token_expires_in: 7200,
                remember_me: true,
            })
        })
    })

    describe('refreshTokenRequest', () => {
        it('should refresh token', async () => {
            const signInResult = {
                jwtToken: 'some-jwt-token',
                refreshToken: 'some-refresh-token',
                rememberMe: true,
                jwtTokenExpiresIn: 3600,
                refreshTokenExpiresIn: 7200,
            }
            mockRefreshTokenFn.mockResolvedValue(signInResult)
            const data = await controller.refreshTokenRequest({
                refresh_token: 'refresh-token',
            })

            expect(mockRefreshTokenFn).toHaveBeenCalledWith('refresh-token')
            expect(data).toEqual({
                jwt_token: 'some-jwt-token',
                jwt_token_expires_in: 3600,
                refresh_token: 'some-refresh-token',
                refresh_token_expires_in: 7200,
                remember_me: true,
            })
        })
    })

    describe('signOutRequest', () => {
        it('should sign out', async () => {
            const res = mockResponse()
            await controller.signOutRequest(res)
            expect(res.clearCookie).toHaveBeenCalledTimes(3)
            expect(res.clearCookie.mock.calls).toEqual([
                ['jwt_token', { httpOnly: true, secure: true }],
                ['refresh_token', { httpOnly: true, secure: true }],
                ['remember_me', { httpOnly: true, secure: true }],
            ])
            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK)
            expect(res.json).toHaveBeenCalledWith({})
        })
    })

    describe('forgotPassword', () => {
        it('should sign out', async () => {
            mockHandleForgotPasswordRequestFn.mockResolvedValue(undefined)
            await controller.forgotPassword({ email: mockUserEntity.email })
            expect(mockHandleForgotPasswordRequestFn).toHaveBeenCalledWith({ email: mockUserEntity.email })
        })
    })

    describe('setNewPassword', () => {
        it('should set new password', async () => {
            mockSetNewPasswordFn.mockResolvedValue(undefined)
            await controller.setNewPassword({ forgot_password_hash: 'hash', password: 'new-password' })
            expect(mockSetNewPasswordFn).toHaveBeenCalledWith({
                forgot_password_hash: 'hash',
                password: 'new-password',
            })
        })
    })

    describe('updatePassword', () => {
        it('should update password', async () => {
            mockUpdatePasswordFn.mockResolvedValue(undefined)
            await controller.updatePassword(
                { new_password: 'new-password', old_password: 'old-password' },
                mockUserEntity,
            )
            expect(mockUpdatePasswordFn).toHaveBeenCalledWith(mockUserEntity, {
                new_password: 'new-password',
                old_password: 'old-password',
            })
        })
        it('should throw error if old password is incorrect', async () => {
            mockUpdatePasswordFn.mockRejectedValue(new ForbiddenException('Old password is incorrect'))
            await expect(
                controller.updatePassword(
                    { new_password: 'new-password', old_password: 'old-password' },
                    mockUserEntity,
                ),
            ).rejects.toThrow('Old password is incorrect')
            expect(mockUpdatePasswordFn).toHaveBeenCalledWith(mockUserEntity, {
                new_password: 'new-password',
                old_password: 'old-password',
            })
        })
        it('should throw error if new password is the same as the old password', async () => {
            mockUpdatePasswordFn.mockRejectedValue(
                new ForbiddenException('New password cannot be the same as the old password'),
            )
            await expect(
                controller.updatePassword(
                    { new_password: 'new-password', old_password: 'old-password' },
                    mockUserEntity,
                ),
            ).rejects.toThrow('New password cannot be the same as the old password')
            expect(mockUpdatePasswordFn).toHaveBeenCalledWith(mockUserEntity, {
                new_password: 'new-password',
                old_password: 'old-password',
            })
        })
    })
})
