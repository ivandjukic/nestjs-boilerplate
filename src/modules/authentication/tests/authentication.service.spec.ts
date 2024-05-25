import { Test, TestingModule } from '@nestjs/testing'
import { AuthenticationService } from '../authentication.service'
import { UserService } from '../../user/user.service'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '../../jwt/jwt.service'
import { OrganizationService } from '../../organization/organization.service'
import { RoleService } from '../../role/role.service'
import { DataSource } from 'typeorm'
import { mockUserEntity } from '../../user/tests/mocks/mockUserEntity'
import { mockOrganizationEntity } from '../../organization/tests/mocks/mockOrganizationEntity'
import { RoleName } from '../../role/enums/RoleName'
import { Logger } from '../../logger/logger'
import { EnvVariableName } from '../../../common/enums/EnvVariableName'
import { hashSecret } from '../../../common/utils/hashSecret'
import { ProjectService } from '../../project/project.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { ForgotPasswordRequestEntity } from '../../forgot-password/entities/forgot-password.entity'
import { UserEntityRelation } from '../../user/enums/UserEntityRelation'
import { mockForgotPasswordRequest } from './mocks/mockForgotPasswordRequest'
import { EmailService } from '../../email/email.service'
const jwt = require('jsonwebtoken')
let dataSource: DataSource

jest.mock('../../../common/utils/hashSecret')
jest.mock('jsonwebtoken', () => ({
    ...jest.requireActual('jsonwebtoken'),
    verify: jest.fn(),
}))

describe('AuthenticationService', () => {
    let service: AuthenticationService
    // userService
    let mockUserServiceFindByEmailFn: jest.Mock
    let mockUserServiceFindByIdFn: jest.Mock
    let mockUserServiceCreateThreadSafeFn: jest.Mock
    let mockUserServiceconfirmUserFn: jest.Mock
    let mockInvalidatePasswordThreadSafeFn: jest.Mock
    let mockSetNewPasswordFn: jest.Mock
    // jwtService
    let mockJwtServiceFindUserIdFromAccountVerificationHashFn: jest.Mock
    let mockJwtServiceGenerateHashForAccountVerificationFn: jest.Mock
    let mockJwtServiceGenerateAccessTokenFn: jest.Mock
    let mockJwtServiceGenerateRefreshTokenFn: jest.Mock
    // DataSource
    let mockStartTransactionFn: jest.Mock
    let mockCreateQueryRunnerFn: jest.Mock
    let mockReleaseTransactionFn: jest.Mock
    let mockRollbackTransactionFn: jest.Mock
    let mockCommitTransactionFn: jest.Mock
    let mockSaveQueryRunnerFn: jest.Mock
    // organizationService
    let mockOrganizationServiceCreateThreadSafeFn: jest.Mock
    // roleService
    let mockRoleServiceSetUserRolesThreadSafeFn: jest.Mock
    // configService
    let mockConfigServiceGetOrThrowFn: jest.Mock
    // EmailService
    let mockEmailServiceSendEmail: jest.Mock
    // Logger
    let mockLoggerErrorFn: jest.Mock
    let mockLoggerLogFn: jest.Mock
    // ProjectService
    let mockProjectServiceCreateThreadSafeFn: jest.Mock
    // ForgotPasswordRequestEntity
    let mockForgotPasswordRequestEntityFindOneFn: jest.Mock
    let mockForgotPasswordRequestEntityUpdateFn: jest.Mock
    let mockForgotPasswordRequestEntityFindFn: jest.Mock
    let mockForgotPasswordRequestEntitySaveFn: jest.Mock

    beforeEach(async () => {
        // userService
        mockUserServiceFindByEmailFn = jest.fn()
        mockUserServiceCreateThreadSafeFn = jest.fn()
        mockUserServiceFindByIdFn = jest.fn()
        mockUserServiceconfirmUserFn = jest.fn()
        mockInvalidatePasswordThreadSafeFn = jest.fn()
        mockSetNewPasswordFn = jest.fn()
        // jwtService
        mockJwtServiceFindUserIdFromAccountVerificationHashFn = jest.fn()
        mockJwtServiceGenerateHashForAccountVerificationFn = jest.fn()
        mockJwtServiceGenerateAccessTokenFn = jest.fn()
        mockJwtServiceGenerateRefreshTokenFn = jest.fn()
        // DataSource
        mockStartTransactionFn = jest.fn()
        mockCreateQueryRunnerFn = jest.fn()
        mockReleaseTransactionFn = jest.fn()
        mockRollbackTransactionFn = jest.fn()
        mockCommitTransactionFn = jest.fn()
        mockSaveQueryRunnerFn = jest.fn()
        // organizationService
        mockOrganizationServiceCreateThreadSafeFn = jest.fn()
        // roleService
        mockRoleServiceSetUserRolesThreadSafeFn = jest.fn()
        // configService
        mockConfigServiceGetOrThrowFn = jest.fn()
        // EmailService
        mockEmailServiceSendEmail = jest.fn()
        // Logger
        mockLoggerErrorFn = jest.fn()
        mockLoggerLogFn = jest.fn()
        // ProjectService
        mockProjectServiceCreateThreadSafeFn = jest.fn()
        // ForgotPasswordRequestEntity
        mockForgotPasswordRequestEntityFindOneFn = jest.fn()
        mockForgotPasswordRequestEntityUpdateFn = jest.fn()
        mockForgotPasswordRequestEntityFindFn = jest.fn()
        mockForgotPasswordRequestEntitySaveFn = jest.fn()

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthenticationService,
                {
                    provide: UserService,
                    useValue: {
                        findByEmail: mockUserServiceFindByEmailFn,
                        findById: mockUserServiceFindByIdFn,
                        createThreadSafe: mockUserServiceCreateThreadSafeFn,
                        confirmUser: mockUserServiceconfirmUserFn,
                        invalidatePasswordThreadSafe: mockInvalidatePasswordThreadSafeFn,
                        setNewPassword: mockSetNewPasswordFn,
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        getOrThrow: mockConfigServiceGetOrThrowFn,
                    },
                },
                {
                    provide: EmailService,
                    useValue: {
                        sendEmail: mockEmailServiceSendEmail,
                    },
                },
                {
                    provide: JwtService,
                    useValue: {
                        generateHashForAccountVerification: mockJwtServiceGenerateHashForAccountVerificationFn,
                        findUserIdFromAccountVerificationHash: mockJwtServiceFindUserIdFromAccountVerificationHashFn,
                        generateAccessToken: mockJwtServiceGenerateAccessTokenFn,
                        generateRefreshToken: mockJwtServiceGenerateRefreshTokenFn,
                    },
                },
                {
                    provide: OrganizationService,
                    useValue: {
                        createThreadSafe: mockOrganizationServiceCreateThreadSafeFn,
                    },
                },
                {
                    provide: RoleService,
                    useValue: {
                        setUserRolesThreadSafe: mockRoleServiceSetUserRolesThreadSafeFn,
                    },
                },
                {
                    provide: DataSource,
                    useValue: {
                        createQueryRunner: mockCreateQueryRunnerFn.mockReturnValueOnce({
                            startTransaction: mockStartTransactionFn,
                            release: mockReleaseTransactionFn,
                            rollbackTransaction: mockRollbackTransactionFn,
                            commitTransaction: mockCommitTransactionFn,
                            manager: {
                                save: mockSaveQueryRunnerFn,
                            },
                        }),
                    },
                },
                {
                    provide: Logger,
                    useValue: {
                        log: mockLoggerLogFn,
                        error: mockLoggerErrorFn,
                    },
                },
                {
                    provide: ProjectService,
                    useValue: {
                        createThreadSafe: mockProjectServiceCreateThreadSafeFn,
                    },
                },
                {
                    provide: getRepositoryToken(ForgotPasswordRequestEntity),
                    useValue: {
                        findOne: mockForgotPasswordRequestEntityFindOneFn,
                        update: mockForgotPasswordRequestEntityUpdateFn,
                        find: mockForgotPasswordRequestEntityFindFn,
                        save: mockForgotPasswordRequestEntitySaveFn,
                    },
                },
            ],
        }).compile()
        service = module.get(AuthenticationService)
        dataSource = module.get(DataSource)
    })

    afterEach(() => jest.clearAllMocks())

    it('should be defined', () => {
        expect(service).toBeDefined()
    })

    describe('signUp', () => {
        const signupData = {
            email: 'me@example.com',
            first_name: 'John',
            last_name: 'Doe',
            password: 'password',
        }
        it('Should not create a user if the user already exists', async () => {
            const sendVerificationEmailSpy = jest.spyOn(service as any, 'sendVerificationEmail')
            mockUserServiceFindByEmailFn.mockResolvedValueOnce(mockUserEntity)
            await service.signUp(signupData)
            expect(mockUserServiceFindByEmailFn).toHaveBeenCalledTimes(1)
            expect(mockUserServiceFindByEmailFn).toHaveBeenCalledWith(signupData.email)
            expect(mockStartTransactionFn).not.toHaveBeenCalled()
            expect(mockOrganizationServiceCreateThreadSafeFn).not.toHaveBeenCalled()
            expect(mockUserServiceCreateThreadSafeFn).not.toHaveBeenCalled()
            expect(mockRoleServiceSetUserRolesThreadSafeFn).not.toHaveBeenCalled()
            expect(sendVerificationEmailSpy).not.toHaveBeenCalled()
            expect(mockCommitTransactionFn).not.toHaveBeenCalled()
            expect(mockRollbackTransactionFn).not.toHaveBeenCalled()
            expect(mockReleaseTransactionFn).not.toHaveBeenCalled()
            expect(mockLoggerErrorFn).toHaveBeenCalledTimes(1)
            expect(mockLoggerErrorFn).toHaveBeenCalledWith(`Signup attempt with existing email: ${signupData.email}`)
            expect(mockUserServiceCreateThreadSafeFn).not.toHaveBeenCalled()
        })

        it('should create a user if the user does not exist', async () => {
            const sendVerificationEmailSpy = jest.spyOn(service as any, 'sendVerificationEmail')
            const hashPasswordSpy = jest.spyOn(service as any, 'hashPassword')
            mockUserServiceFindByEmailFn.mockResolvedValueOnce(null)
            hashPasswordSpy.mockReturnValueOnce('hashed-password')
            mockConfigServiceGetOrThrowFn.mockReturnValueOnce('password-hash-salt')
            mockConfigServiceGetOrThrowFn.mockReturnValueOnce(10000)
            mockOrganizationServiceCreateThreadSafeFn.mockResolvedValueOnce(mockOrganizationEntity)
            mockJwtServiceGenerateHashForAccountVerificationFn.mockReturnValueOnce('account-verification-hash')
            mockUserServiceCreateThreadSafeFn.mockResolvedValueOnce(mockUserEntity)
            await service.signUp(signupData)
            expect(mockUserServiceFindByEmailFn).toHaveBeenCalledTimes(1)
            expect(mockUserServiceFindByEmailFn).toHaveBeenCalledWith(signupData.email)
            expect(mockStartTransactionFn).toHaveBeenCalled()
            expect(mockOrganizationServiceCreateThreadSafeFn).toHaveBeenCalledTimes(1)
            expect(mockOrganizationServiceCreateThreadSafeFn).toHaveBeenCalledWith(
                `${signupData.first_name} ${signupData.last_name}`,
                expect.any(Object),
            )
            expect(mockUserServiceCreateThreadSafeFn).toHaveBeenCalledTimes(1)
            expect(mockUserServiceCreateThreadSafeFn).toHaveBeenCalledWith(
                {
                    firstName: signupData.first_name,
                    lastName: signupData.last_name,
                    email: signupData.email,
                    password: 'hashed-password',
                    organizationId: mockOrganizationEntity.id,
                },
                expect.any(Object),
            )
            expect(hashPasswordSpy).toHaveBeenCalledTimes(1)
            expect(hashPasswordSpy).toHaveBeenCalledWith(signupData.password)
            expect(mockRoleServiceSetUserRolesThreadSafeFn).toHaveBeenCalledTimes(1)
            expect(mockRoleServiceSetUserRolesThreadSafeFn).toHaveBeenCalledWith(
                mockUserEntity,
                [RoleName.ADMIN],
                expect.any(Object),
            )
            expect(sendVerificationEmailSpy).toHaveBeenCalledTimes(1)
            expect(sendVerificationEmailSpy).toHaveBeenCalledWith(mockUserEntity)
            expect(mockCommitTransactionFn).toHaveBeenCalledTimes(1)
            expect(mockRollbackTransactionFn).not.toHaveBeenCalled()
            expect(mockReleaseTransactionFn).toHaveBeenCalledTimes(1)
            expect(mockLoggerErrorFn).not.toHaveBeenCalled()
            expect(mockProjectServiceCreateThreadSafeFn).toHaveBeenCalledTimes(1)
            expect(mockProjectServiceCreateThreadSafeFn).toHaveBeenCalledWith(
                {
                    userId: mockUserEntity.id,
                    name: 'Default Project',
                },
                expect.any(Object),
            )
        })

        it('should rollback the transaction if an error occurs', async () => {
            const sendVerificationEmailSpy = jest.spyOn(service as any, 'sendVerificationEmail')
            const hashPasswordSpy = jest.spyOn(service as any, 'hashPassword')
            mockUserServiceFindByEmailFn.mockResolvedValueOnce(null)
            hashPasswordSpy.mockReturnValueOnce('hashed-password')
            mockConfigServiceGetOrThrowFn.mockReturnValueOnce('password-hash-salt')
            mockConfigServiceGetOrThrowFn.mockReturnValueOnce(10000)
            mockOrganizationServiceCreateThreadSafeFn.mockResolvedValueOnce(mockOrganizationEntity)
            mockJwtServiceGenerateHashForAccountVerificationFn.mockReturnValueOnce('account-verification-hash')
            mockUserServiceCreateThreadSafeFn.mockRejectedValueOnce(new Error('Failed to create user'))
            await expect(service.signUp(signupData)).rejects.toThrow('An error occurred while creating the user')
            expect(mockUserServiceFindByEmailFn).toHaveBeenCalledTimes(1)
            expect(mockUserServiceFindByEmailFn).toHaveBeenCalledWith(signupData.email)
            expect(mockStartTransactionFn).toHaveBeenCalled()
            expect(mockOrganizationServiceCreateThreadSafeFn).toHaveBeenCalledTimes(1)
            expect(mockOrganizationServiceCreateThreadSafeFn).toHaveBeenCalledWith(
                `${signupData.first_name} ${signupData.last_name}`,
                expect.any(Object),
            )
            expect(mockUserServiceCreateThreadSafeFn).toHaveBeenCalledTimes(1)
            expect(mockUserServiceCreateThreadSafeFn).toHaveBeenCalledWith(
                {
                    firstName: signupData.first_name,
                    lastName: signupData.last_name,
                    email: signupData.email,
                    password: 'hashed-password',
                    organizationId: mockOrganizationEntity.id,
                },
                expect.any(Object),
            )
            expect(hashPasswordSpy).toHaveBeenCalledTimes(1)
            expect(hashPasswordSpy).toHaveBeenCalledWith(signupData.password)
            expect(mockRoleServiceSetUserRolesThreadSafeFn).not.toHaveBeenCalled()
            expect(sendVerificationEmailSpy).not.toHaveBeenCalled()
            expect(mockCommitTransactionFn).not.toHaveBeenCalled()
            expect(mockRollbackTransactionFn).toHaveBeenCalledTimes(1)
            expect(mockReleaseTransactionFn).toHaveBeenCalledTimes(1)
            expect(mockLoggerErrorFn).toHaveBeenCalledTimes(1)
            expect(mockLoggerErrorFn).toHaveBeenCalledWith(
                'Error occurred while creating the user',
                new Error('Failed to create user'),
            )
            expect(mockProjectServiceCreateThreadSafeFn).not.toHaveBeenCalled()
        })
    })

    describe('confirmEmail', () => {
        it('should confirm user if user exists and if user is not already confirmed', async () => {
            mockJwtServiceFindUserIdFromAccountVerificationHashFn.mockResolvedValueOnce(mockUserEntity.id)
            mockUserServiceFindByIdFn.mockResolvedValueOnce({
                ...mockUserEntity,
                confirmed_at: null,
            })
            await service.confirmEmail('account-verification-hash')
            expect(mockJwtServiceFindUserIdFromAccountVerificationHashFn).toHaveBeenCalledTimes(1)
            expect(mockJwtServiceFindUserIdFromAccountVerificationHashFn).toHaveBeenCalledWith(
                'account-verification-hash',
            )
            expect(mockUserServiceFindByIdFn).toHaveBeenCalledTimes(1)
            expect(mockUserServiceFindByIdFn).toHaveBeenCalledWith(mockUserEntity.id)
            expect(mockUserServiceconfirmUserFn).toHaveBeenCalledTimes(1)
            expect(mockUserServiceconfirmUserFn).toHaveBeenCalledWith(mockUserEntity.id)
        })
        it('should not confirm user if user does not exist', async () => {
            mockJwtServiceFindUserIdFromAccountVerificationHashFn.mockResolvedValueOnce(mockUserEntity.id)
            mockUserServiceFindByIdFn.mockResolvedValueOnce(null)
            await service.confirmEmail('account-verification-hash')
            expect(mockJwtServiceFindUserIdFromAccountVerificationHashFn).toHaveBeenCalledTimes(1)
            expect(mockJwtServiceFindUserIdFromAccountVerificationHashFn).toHaveBeenCalledWith(
                'account-verification-hash',
            )
            expect(mockUserServiceFindByIdFn).toHaveBeenCalledTimes(1)
            expect(mockUserServiceFindByIdFn).toHaveBeenCalledWith(mockUserEntity.id)
            expect(mockUserServiceconfirmUserFn).not.toHaveBeenCalled()
        })
        it('should not confirm user if user is already confirmed', async () => {
            mockJwtServiceFindUserIdFromAccountVerificationHashFn.mockResolvedValueOnce(mockUserEntity.id)
            mockUserServiceFindByIdFn.mockResolvedValueOnce(mockUserEntity)
            await service.confirmEmail('account-verification-hash')
            expect(mockJwtServiceFindUserIdFromAccountVerificationHashFn).toHaveBeenCalledTimes(1)
            expect(mockJwtServiceFindUserIdFromAccountVerificationHashFn).toHaveBeenCalledWith(
                'account-verification-hash',
            )
            expect(mockUserServiceFindByIdFn).toHaveBeenCalledTimes(1)
            expect(mockUserServiceFindByIdFn).toHaveBeenCalledWith(mockUserEntity.id)
            expect(mockUserServiceconfirmUserFn).not.toHaveBeenCalled()
        })
    })

    describe('signIn', () => {
        it('should throw a ForbiddenException if the user does not exist', async () => {
            mockUserServiceFindByEmailFn.mockResolvedValueOnce(null)
            await expect(service.signIn({ email: '', password: '' })).rejects.toThrow('Forbidden')
        })
        it('should throw a ForbiddenException if the user is not confirmed', async () => {
            mockUserServiceFindByEmailFn.mockResolvedValueOnce({ ...mockUserEntity, confirmed_at: null })
            await expect(service.signIn({ email: '', password: '' })).rejects.toThrow('Forbidden')
        })
        it('should throw a ForbiddenException if the user is not active', async () => {
            mockUserServiceFindByEmailFn.mockResolvedValueOnce({ ...mockUserEntity, isActive: false })
            await expect(service.signIn({ email: '', password: '' })).rejects.toThrow('Forbidden')
        })
        it('should throw a ForbiddenException if the password is invalid', async () => {
            mockUserServiceFindByEmailFn.mockResolvedValueOnce(mockUserEntity)
            jest.spyOn(service as any, 'isPasswordValid').mockReturnValueOnce(false)
            await expect(service.signIn({ email: '', password: '' })).rejects.toThrow('Forbidden')
        })
        it('should return the jwt token and refresh token if the user is valid', async () => {
            mockUserServiceFindByEmailFn.mockResolvedValueOnce(mockUserEntity)
            jest.spyOn(service as any, 'isPasswordValid').mockReturnValueOnce(true)
            mockConfigServiceGetOrThrowFn.mockReturnValueOnce('30m')
            mockConfigServiceGetOrThrowFn.mockReturnValueOnce('1d')
            mockJwtServiceGenerateAccessTokenFn.mockReturnValueOnce('jwt-token')
            mockJwtServiceGenerateRefreshTokenFn.mockReturnValueOnce('refresh-token')
            const result = await service.signIn({ email: mockUserEntity.email, password: mockUserEntity.password })
            expect(result).toEqual({
                jwtToken: 'jwt-token',
                refreshToken: 'refresh-token',
                rememberMe: false,
                jwtTokenExpiresIn: 1800000,
                refreshTokenExpiresIn: 86400000,
            })
            expect(mockUserServiceFindByEmailFn).toHaveBeenCalledTimes(1)
            expect(mockUserServiceFindByEmailFn).toHaveBeenCalledWith(mockUserEntity.email)
            expect(mockConfigServiceGetOrThrowFn).toHaveBeenCalledTimes(2)
            expect(mockConfigServiceGetOrThrowFn.mock.calls).toEqual([
                [EnvVariableName.JWT_TOKEN_EXPIRES_IN, '30m'],
                [EnvVariableName.JWT_REFRESH_TOKEN_EXPIRES_IN, '1d'],
            ])
            expect(mockJwtServiceGenerateAccessTokenFn).toHaveBeenCalledTimes(1)
            expect(mockJwtServiceGenerateAccessTokenFn).toHaveBeenCalledWith(mockUserEntity, '30m', false)
            expect(mockJwtServiceGenerateRefreshTokenFn).toHaveBeenCalledTimes(1)
            expect(mockJwtServiceGenerateRefreshTokenFn).toHaveBeenCalledWith(mockUserEntity.id, '1d', false)
        })
    })

    describe('refreshToken', () => {
        it('should throw an UnauthorizedException if the refresh token is invalid', async () => {
            mockConfigServiceGetOrThrowFn.mockReturnValueOnce('jwt-secret')
            mockJwtServiceGenerateAccessTokenFn.mockReturnValueOnce('jwt-token')
            mockJwtServiceGenerateRefreshTokenFn.mockReturnValueOnce('refresh-token')
            jwt.verify.mockImplementation((token, secretOrPublicKey, callback) => {
                callback(new Error('Token has been expired'), undefined)
            })
            await expect(service.refreshToken('invalid-refresh-token')).rejects.toThrow('Unauthorized')
            expect(mockUserServiceFindByIdFn).not.toHaveBeenCalled()
            expect(mockConfigServiceGetOrThrowFn).toHaveBeenCalledTimes(1)
            expect(mockConfigServiceGetOrThrowFn).toHaveBeenCalledWith(EnvVariableName.JWT_SECRET, '')
            expect(mockJwtServiceGenerateAccessTokenFn).not.toHaveBeenCalled()
            expect(mockJwtServiceGenerateRefreshTokenFn).not.toHaveBeenCalled()
        })
        it('should return the jwt token and refresh token if the refresh token is valid', async () => {
            mockConfigServiceGetOrThrowFn.mockReturnValueOnce('jwt-secret')
            mockJwtServiceGenerateAccessTokenFn.mockReturnValueOnce('jwt-token')
            mockJwtServiceGenerateRefreshTokenFn.mockReturnValueOnce('refresh-token')
            mockConfigServiceGetOrThrowFn.mockReturnValueOnce('30m')
            mockConfigServiceGetOrThrowFn.mockReturnValueOnce('1d')
            jwt.verify.mockImplementation((token, secretOrPublicKey, callback) => {
                callback(undefined, { id: mockUserEntity.id, rememberMe: false })
            })
            mockUserServiceFindByIdFn.mockResolvedValueOnce(mockUserEntity)
            const result = await service.refreshToken('valid-refresh-token')
            expect(result).toEqual({
                jwtToken: 'jwt-token',
                refreshToken: 'refresh-token',
                rememberMe: false,
                jwtTokenExpiresIn: 1800000,
                refreshTokenExpiresIn: 86400000,
            })
            expect(mockUserServiceFindByIdFn).toHaveBeenCalledTimes(1)
            expect(mockUserServiceFindByIdFn).toHaveBeenCalledWith(mockUserEntity.id)
            expect(mockConfigServiceGetOrThrowFn).toHaveBeenCalledTimes(3)
            expect(mockConfigServiceGetOrThrowFn.mock.calls).toEqual([
                [EnvVariableName.JWT_SECRET, ''],
                [EnvVariableName.JWT_TOKEN_EXPIRES_IN, '30m'],
                [EnvVariableName.JWT_REFRESH_TOKEN_EXPIRES_IN, '1d'],
            ])
            expect(mockJwtServiceGenerateAccessTokenFn).toHaveBeenCalledTimes(1)
            expect(mockJwtServiceGenerateAccessTokenFn).toHaveBeenCalledWith(mockUserEntity, '30m', false)
            expect(mockJwtServiceGenerateRefreshTokenFn).toHaveBeenCalledTimes(1)
            expect(mockJwtServiceGenerateRefreshTokenFn).toHaveBeenCalledWith(mockUserEntity.id, '1d', false)
        })
        it('should return a proper jwt token and refresh token if the refresh token is valid and rememberMe is true', async () => {
            mockConfigServiceGetOrThrowFn.mockReturnValueOnce('jwt-secret')
            mockJwtServiceGenerateAccessTokenFn.mockReturnValueOnce('jwt-token')
            mockJwtServiceGenerateRefreshTokenFn.mockReturnValueOnce('refresh-token')
            mockConfigServiceGetOrThrowFn.mockReturnValueOnce('30m')
            jwt.verify.mockImplementation((token, secretOrPublicKey, callback) => {
                callback(undefined, { id: mockUserEntity.id, rememberMe: true })
            })
            mockUserServiceFindByIdFn.mockResolvedValueOnce(mockUserEntity)
            const result = await service.refreshToken('valid-refresh-token')
            expect(result).toEqual({
                jwtToken: 'jwt-token',
                refreshToken: 'refresh-token',
                rememberMe: true,
                jwtTokenExpiresIn: 1800000,
                refreshTokenExpiresIn: 2678400000,
            })
            expect(mockUserServiceFindByIdFn).toHaveBeenCalledTimes(1)
            expect(mockUserServiceFindByIdFn).toHaveBeenCalledWith(mockUserEntity.id)
            expect(mockConfigServiceGetOrThrowFn).toHaveBeenCalledTimes(2)
            expect(mockConfigServiceGetOrThrowFn.mock.calls).toEqual([
                [EnvVariableName.JWT_SECRET, ''],
                [EnvVariableName.JWT_TOKEN_EXPIRES_IN, '30m'],
            ])
            expect(mockJwtServiceGenerateAccessTokenFn).toHaveBeenCalledTimes(1)
            expect(mockJwtServiceGenerateAccessTokenFn).toHaveBeenCalledWith(mockUserEntity, '30m', true)
            expect(mockJwtServiceGenerateRefreshTokenFn).toHaveBeenCalledTimes(1)
            expect(mockJwtServiceGenerateRefreshTokenFn).toHaveBeenCalledWith(mockUserEntity.id, '31d', true)
        })
        it('should return a proper jwt token and refresh token if the refresh token is valid and rememberMe is false', async () => {
            mockConfigServiceGetOrThrowFn.mockReturnValueOnce('jwt-secret')
            mockJwtServiceGenerateAccessTokenFn.mockReturnValueOnce('jwt-token')
            mockJwtServiceGenerateRefreshTokenFn.mockReturnValueOnce('refresh-token')
            mockConfigServiceGetOrThrowFn.mockReturnValueOnce('30m')
            mockConfigServiceGetOrThrowFn.mockReturnValueOnce('1d')
            jwt.verify.mockImplementation((token, secretOrPublicKey, callback) => {
                callback(undefined, { id: mockUserEntity.id, rememberMe: false })
            })
            mockUserServiceFindByIdFn.mockResolvedValueOnce(mockUserEntity)
            const result = await service.refreshToken('valid-refresh-token')
            expect(result).toEqual({
                jwtToken: 'jwt-token',
                refreshToken: 'refresh-token',
                rememberMe: false,
                jwtTokenExpiresIn: 1800000,
                refreshTokenExpiresIn: 86400000,
            })
            expect(mockUserServiceFindByIdFn).toHaveBeenCalledTimes(1)
            expect(mockUserServiceFindByIdFn).toHaveBeenCalledWith(mockUserEntity.id)
            expect(mockConfigServiceGetOrThrowFn).toHaveBeenCalledTimes(3)
            expect(mockConfigServiceGetOrThrowFn.mock.calls).toEqual([
                [EnvVariableName.JWT_SECRET, ''],
                [EnvVariableName.JWT_TOKEN_EXPIRES_IN, '30m'],
                [EnvVariableName.JWT_REFRESH_TOKEN_EXPIRES_IN, '1d'],
            ])
            expect(mockJwtServiceGenerateAccessTokenFn).toHaveBeenCalledTimes(1)
            expect(mockJwtServiceGenerateAccessTokenFn).toHaveBeenCalledWith(mockUserEntity, '30m', false)
            expect(mockJwtServiceGenerateRefreshTokenFn).toHaveBeenCalledTimes(1)
            expect(mockJwtServiceGenerateRefreshTokenFn).toHaveBeenCalledWith(mockUserEntity.id, '1d', false)
        })
    })

    describe('hashPassword', () => {
        it('should return a hashed password', async () => {
            mockConfigServiceGetOrThrowFn.mockReturnValueOnce('password-hash-salt')
            mockConfigServiceGetOrThrowFn.mockReturnValueOnce('10000')
            jest.mocked(hashSecret).mockReturnValueOnce('hashed-password')
            const result = await service.hashPassword('password')
            expect(result).toEqual('hashed-password')
            expect(mockConfigServiceGetOrThrowFn.mock.calls).toEqual([
                [EnvVariableName.PASSWORD_HASH_SALT],
                [EnvVariableName.PASSWORD_HASH_NUMBER_OF_ITERATIONS, 10000],
            ])
        })
    })

    describe('handleForgotPasswordRequest', () => {
        it('should not create a forgot password request if the user does not exist', async () => {
            mockUserServiceFindByEmailFn.mockResolvedValueOnce(null)
            const senForgotPasswordEmailSpy = jest.spyOn(service as any, 'sendForgotPasswordEmail')
            await service.handleForgotPasswordRequest({ email: mockUserEntity.email })
            expect(mockCreateQueryRunnerFn).not.toHaveBeenCalled()
            expect(mockUserServiceFindByEmailFn).toHaveBeenCalledTimes(1)
            expect(mockUserServiceFindByEmailFn).toHaveBeenCalledWith(mockUserEntity.email, [UserEntityRelation.ROLES])
            expect(mockInvalidatePasswordThreadSafeFn).not.toHaveBeenCalled()
            expect(mockJwtServiceGenerateHashForAccountVerificationFn).not.toHaveBeenCalled()
            expect(mockForgotPasswordRequestEntityUpdateFn).not.toHaveBeenCalled()
            expect(senForgotPasswordEmailSpy).not.toHaveBeenCalled()
            expect(mockCommitTransactionFn).not.toHaveBeenCalled()
        })
        it('should create a forgot password request if the user exists', async () => {
            mockUserServiceFindByEmailFn.mockResolvedValueOnce(mockUserEntity)
            mockJwtServiceGenerateHashForAccountVerificationFn.mockReturnValueOnce('forgot-password-hash')
            const senForgotPasswordEmailSpy = jest
                .spyOn(service as any, 'sendForgotPasswordEmail')
                .mockReturnValueOnce({})
            const saveForgotPasswordRequestThreadSafeSpy = jest
                .spyOn(service as any, 'saveForgotPasswordRequestThreadSafe')
                .mockReturnValueOnce({})
            await service.handleForgotPasswordRequest({ email: mockUserEntity.email })
            expect(mockCreateQueryRunnerFn).toHaveBeenCalledTimes(1)
            expect(mockUserServiceFindByEmailFn).toHaveBeenCalledTimes(1)
            expect(mockUserServiceFindByEmailFn).toHaveBeenCalledWith(mockUserEntity.email, [UserEntityRelation.ROLES])
            expect(mockInvalidatePasswordThreadSafeFn).toHaveBeenCalledTimes(1)
            expect(mockInvalidatePasswordThreadSafeFn).toHaveBeenCalledWith(mockUserEntity.id, expect.any(Object))
            expect(mockJwtServiceGenerateHashForAccountVerificationFn).toHaveBeenCalledTimes(1)
            expect(mockJwtServiceGenerateHashForAccountVerificationFn).toHaveBeenCalledWith(mockUserEntity)
            expect(senForgotPasswordEmailSpy).toHaveBeenCalledTimes(1)
            expect(senForgotPasswordEmailSpy).toHaveBeenCalledWith(mockUserEntity, 'forgot-password-hash')
            expect(mockCommitTransactionFn).toHaveBeenCalledTimes(1)
            expect(mockRollbackTransactionFn).not.toHaveBeenCalled()
            expect(mockReleaseTransactionFn).toHaveBeenCalledTimes(1)
            expect(saveForgotPasswordRequestThreadSafeSpy).toHaveBeenCalledTimes(1)
            expect(saveForgotPasswordRequestThreadSafeSpy).toHaveBeenCalledWith(
                mockUserEntity.id,
                'forgot-password-hash',
                expect.any(Object),
            )
        })
    })

    describe('saveForgotPasswordRequest', () => {
        it('should save a forgot password request', async () => {
            mockForgotPasswordRequestEntitySaveFn.mockResolvedValueOnce(mockForgotPasswordRequest)
            const result = await service.saveForgotPasswordRequest(mockUserEntity.id, 'forgot-password-hash')
            expect(result).toEqual(mockForgotPasswordRequest)
            expect(mockForgotPasswordRequestEntitySaveFn).toHaveBeenCalledTimes(1)
            expect(mockForgotPasswordRequestEntitySaveFn).toHaveBeenCalledWith({
                user_id: mockUserEntity.id,
                hash: 'forgot-password-hash',
                is_valid: true,
            })
        })
    })

    describe('saveForgotPasswordRequestThreadSafe', () => {
        it('should save a forgot password request', async () => {
            const queryRunner = dataSource.createQueryRunner()
            mockSaveQueryRunnerFn.mockResolvedValueOnce(null)
            await service.saveForgotPasswordRequestThreadSafe(mockUserEntity.id, 'forgot-password-hash', queryRunner)
            expect(mockSaveQueryRunnerFn).toHaveBeenCalledTimes(1)
            expect(mockSaveQueryRunnerFn).toHaveBeenCalledWith(ForgotPasswordRequestEntity, {
                user_id: mockUserEntity.id,
                hash: 'forgot-password-hash',
                is_valid: true,
            })
            expect(mockForgotPasswordRequestEntityUpdateFn).not.toHaveBeenCalled()
        })
    })

    describe('invalidateForgotPasswordHashByHash', () => {
        it('should invalidate a forgot password hash', async () => {
            mockForgotPasswordRequestEntityUpdateFn.mockResolvedValueOnce(mockForgotPasswordRequest)
            await service.invalidateForgotPasswordHashByHash('forgot-password-hash')
            expect(mockForgotPasswordRequestEntityUpdateFn).toHaveBeenCalledTimes(1)
            expect(mockForgotPasswordRequestEntityUpdateFn).toHaveBeenCalledWith(
                { hash: 'forgot-password-hash' },
                { is_valid: false },
            )
        })
    })

    describe('getForgotPasswordRequestsByUserId', () => {
        it('should return a forgot password request', async () => {
            mockForgotPasswordRequestEntityFindFn.mockResolvedValueOnce([mockForgotPasswordRequest])
            const result = await service.getForgotPasswordRequestsByUserId(mockForgotPasswordRequest.user_id)
            expect(result).toEqual([mockForgotPasswordRequest])
            expect(mockForgotPasswordRequestEntityFindFn).toHaveBeenCalledTimes(1)
            expect(mockForgotPasswordRequestEntityFindFn).toHaveBeenCalledWith({
                where: { user_id: mockForgotPasswordRequest.user_id },
            })
        })
    })
    describe('updatePassword', () => {
        it('should throw a ForbiddenException if the old password is invalid', async () => {
            const isPasswordValidSpy = jest.spyOn(service as any, 'isPasswordValid')
            isPasswordValidSpy.mockReturnValueOnce(false)
            await expect(
                service.updatePassword(mockUserEntity, { new_password: 'new-password', old_password: 'old-password' }),
            ).rejects.toThrow('Old password is incorrect')
            expect(isPasswordValidSpy).toHaveBeenCalledTimes(1)
            expect(isPasswordValidSpy).toHaveBeenCalledWith(mockUserEntity, 'old-password')
            expect(mockSetNewPasswordFn).not.toHaveBeenCalled()
        })
        it('should throw an error if the new password is the same as the old password', async () => {
            const isPasswordValidSpy = jest.spyOn(service as any, 'isPasswordValid')
            isPasswordValidSpy.mockReturnValueOnce(true)
            await expect(
                service.updatePassword(mockUserEntity, { new_password: 'old-password', old_password: 'old-password' }),
            ).rejects.toThrow('New password cannot be the same as the old password')
            expect(isPasswordValidSpy).toHaveBeenCalledTimes(1)
            expect(isPasswordValidSpy).toHaveBeenCalledWith(mockUserEntity, 'old-password')
            expect(mockSetNewPasswordFn).not.toHaveBeenCalled()
        })
        it('should update the password if the old password is valid', async () => {
            const isPasswordValidSpy = jest.spyOn(service as any, 'isPasswordValid')
            jest.mocked(hashSecret).mockReturnValueOnce('hashed-password')
            isPasswordValidSpy.mockReturnValueOnce(true)
            await service.updatePassword(mockUserEntity, { new_password: 'new-password', old_password: 'old-password' })
            expect(isPasswordValidSpy).toHaveBeenCalledTimes(1)
            expect(isPasswordValidSpy).toHaveBeenCalledWith(mockUserEntity, 'old-password')
            expect(hashSecret).toHaveBeenCalledTimes(1)
            expect(hashSecret).toHaveBeenCalledWith('new-password', undefined, NaN)
            expect(mockSetNewPasswordFn).toHaveBeenCalledTimes(1)
            expect(mockSetNewPasswordFn).toHaveBeenCalledWith(mockUserEntity.id, 'hashed-password')
        })
    })

    describe('sendSetNewPasswordEmail', () => {
        it('should send a set new password email', async () => {
            await service.sendSetNewPasswordEmail(mockUserEntity, 'set-new-password-hash')
            expect(mockEmailServiceSendEmail).toHaveBeenCalledTimes(1)
        })
    })
})
