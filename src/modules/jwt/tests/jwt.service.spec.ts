import { Test, TestingModule } from '@nestjs/testing'
import { JwtService } from '../jwt.service'
import { ConfigService } from '@nestjs/config'
import { mockUserEntity } from '../../user/tests/mocks/mockUserEntity'
import * as jsonwebtoken from 'jsonwebtoken'
import { EnvVariableName } from '../../../common/enums/EnvVariableName'
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn().mockImplementation(() => 'mockedToken'),
    verify: jest.fn().mockImplementation((token, secret, callback) => callback(undefined, { user_id: 'userId' })),
}))

describe('JwtService', () => {
    let service: JwtService
    let mockConfigServiceGetOrThrowFn: jest.Mock

    const mockJwtSecret = 'jwtSecret'
    const mockAccountConfirmationHashExpiresIn = '30m'
    const mockJwtTokenExpiresIn = '15m'
    const mockRefreshTokenExpiresIn = '7d'
    const mockJwtToken = 'mockedToken'
    const mockRefreshToken = 'mockedRefreshToken'

    beforeEach(async () => {
        mockConfigServiceGetOrThrowFn = jest.fn()

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                JwtService,
                {
                    provide: ConfigService,
                    useValue: {
                        getOrThrow: mockConfigServiceGetOrThrowFn,
                    },
                },
            ],
        }).compile()
        service = module.get<JwtService>(JwtService)
    })

    afterEach(() => jest.clearAllMocks())

    it('should be defined', () => {
        expect(service).toBeDefined()
    })

    describe('generateHashForAccountVerification', () => {
        it('should generate a hash', async () => {
            mockConfigServiceGetOrThrowFn.mockReturnValueOnce(mockJwtSecret)
            mockConfigServiceGetOrThrowFn.mockReturnValueOnce(mockAccountConfirmationHashExpiresIn)
            const hash = await service.generateHashForAccountVerification(mockUserEntity)

            expect(hash).toEqual('mockedToken')
            expect(mockConfigServiceGetOrThrowFn.mock.calls).toEqual([
                [EnvVariableName.JWT_SECRET],
                [EnvVariableName.ACCOUNT_CONFIRMATION_HASH_EXPIRES_IN, '30m'],
            ])
        })
    })

    describe('findUserIdFromAccountVerificationHash', () => {
        it('should return a user ID from a valid hash', async () => {
            const userId = await service.findUserIdFromAccountVerificationHash('validToken')
            expect(userId).toEqual('userId')
        })
    })

    describe('generateAccessToken', () => {
        it('should call jsonwebtoken.sign', () => {
            const spySignFn = jest.spyOn(jsonwebtoken, 'sign')
            spySignFn.mockImplementationOnce(() => mockJwtToken)
            mockConfigServiceGetOrThrowFn.mockImplementationOnce(() => mockJwtSecret)
            mockConfigServiceGetOrThrowFn.mockImplementation(() => mockJwtTokenExpiresIn)

            const result = service.generateAccessToken(mockUserEntity, mockJwtTokenExpiresIn, false)
            expect(spySignFn).toBeCalledTimes(1)
            expect(spySignFn).toBeCalledWith({ id: mockUserEntity.id, rememberMe: false }, mockJwtSecret, {
                expiresIn: mockJwtTokenExpiresIn,
            })
            expect(result).toEqual(mockJwtToken)
        })
        it('should call jsonwebtoken.sign with rememberMe', async () => {
            const spySignFn = jest.spyOn(jsonwebtoken, 'sign')
            spySignFn.mockImplementationOnce(() => mockJwtToken)
            mockConfigServiceGetOrThrowFn.mockImplementationOnce(() => mockJwtSecret)
            mockConfigServiceGetOrThrowFn.mockImplementation(() => mockJwtTokenExpiresIn)

            // @ts-ignore
            const result = await service.generateAccessToken(mockUserEntity, mockJwtTokenExpiresIn, true)
            expect(spySignFn).toBeCalledTimes(1)
            expect(spySignFn).toBeCalledWith({ id: mockUserEntity.id, rememberMe: true }, mockJwtSecret, {
                expiresIn: mockJwtTokenExpiresIn,
            })
            expect(result).toEqual(mockJwtToken)
        })
    })

    describe('generateRefreshToken', () => {
        it('should call jsonwebtoken.sign', async () => {
            const spySignFn = jest.spyOn(jsonwebtoken, 'sign')
            spySignFn.mockImplementationOnce(() => mockRefreshToken)
            mockConfigServiceGetOrThrowFn.mockImplementationOnce(() => mockJwtSecret)
            mockConfigServiceGetOrThrowFn.mockImplementation(() => mockRefreshTokenExpiresIn)

            const result = service.generateRefreshToken(mockUserEntity.id, mockRefreshTokenExpiresIn, false)
            expect(spySignFn).toBeCalledTimes(1)
            expect(spySignFn).toBeCalledWith(
                { id: mockUserEntity.id, refresh: true, rememberMe: false },
                mockJwtSecret,
                {
                    expiresIn: mockRefreshTokenExpiresIn,
                },
            )
            expect(result).toEqual(mockRefreshToken)
        })
        it('should call jsonwebtoken.sign with rememberMe', async () => {
            const spySignFn = jest.spyOn(jsonwebtoken, 'sign')
            spySignFn.mockImplementationOnce(() => mockRefreshToken)
            mockConfigServiceGetOrThrowFn.mockImplementationOnce(() => mockJwtSecret)
            mockConfigServiceGetOrThrowFn.mockImplementation(() => mockRefreshTokenExpiresIn)

            const result = service.generateRefreshToken(mockUserEntity.id, mockRefreshTokenExpiresIn, true)
            expect(spySignFn).toBeCalledTimes(1)
            expect(spySignFn).toBeCalledWith(
                { id: mockUserEntity.id, refresh: true, rememberMe: true },
                mockJwtSecret,
                {
                    expiresIn: mockRefreshTokenExpiresIn,
                },
            )
            expect(result).toEqual(mockRefreshToken)
        })
    })
    describe('generateTokenForNewUserToSetPassword', () => {
        it('should generate a token', async () => {
            mockConfigServiceGetOrThrowFn.mockReturnValueOnce(mockJwtSecret)
            const token = await service.generateTokenForNewUserToSetPassword(mockUserEntity)

            expect(token).toEqual('mockedToken')
            expect(mockConfigServiceGetOrThrowFn).toHaveBeenCalledWith(EnvVariableName.JWT_SECRET)
        })
    })
    describe('validateTokenForNewUserToSetPasswordAndGetUserId', () => {
        it('should return a user ID from a valid token', async () => {
            const userId = await service.validateTokenForNewUserToSetPasswordAndGetUserId('validToken')
            expect(userId).toEqual('userId')
        })
    })
})
