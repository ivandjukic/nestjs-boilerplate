import { ForbiddenException, Injectable } from '@nestjs/common'
import { UserEntity } from '../user/entities/user.entity'
import { sign, TokenExpiredError, verify } from 'jsonwebtoken'
import { ConfigService } from '@nestjs/config'
import { AccountVerificationHashExpired } from '../authentication/errors/AccountVerificationHashExpired'
import { EnvVariableName } from '../../common/enums/EnvVariableName'

@Injectable()
export class JwtService {
    constructor(private readonly configService: ConfigService) {}

    public async generateHashForAccountVerification(user: UserEntity): Promise<string> {
        const hash = sign({ user_id: user.id }, this.configService.getOrThrow<string>(EnvVariableName.JWT_SECRET), {
            expiresIn: this.configService.getOrThrow<string>(
                EnvVariableName.ACCOUNT_CONFIRMATION_HASH_EXPIRES_IN,
                '30m',
            ),
        })
        return hash
    }

    public async findUserIdFromAccountVerificationHash(hash: string): Promise<string> {
        let userId: string
        await verify(
            hash,
            this.configService.getOrThrow<string>(EnvVariableName.JWT_SECRET),
            async (err, payload: any) => {
                if (err && err instanceof TokenExpiredError) {
                    throw new AccountVerificationHashExpired(
                        'The account verification hash has expired. Please sign up again.',
                    )
                }
                if (err || payload === undefined) {
                    throw new ForbiddenException()
                }
                userId = payload.user_id
            },
        )
        return userId
    }

    public generateAccessToken(user: UserEntity, expiresIn: string, rememberMe: boolean = false): string {
        const token = sign(
            { id: user.id, rememberMe },
            this.configService.getOrThrow<string>(EnvVariableName.JWT_SECRET),
            {
                expiresIn,
            },
        )

        return token
    }

    public generateRefreshToken(userId: string, expiresIn: string, rememberMe: boolean = false): string {
        const token = sign(
            { id: userId, refresh: true, rememberMe },
            this.configService.getOrThrow<string>(EnvVariableName.JWT_SECRET),
            {
                expiresIn,
            },
        )
        return token
    }

    public async generateTokenForNewUserToSetPassword(user: UserEntity): Promise<string> {
        const token = sign({ user_id: user.id }, this.configService.getOrThrow<string>(EnvVariableName.JWT_SECRET), {
            expiresIn: '1d',
        })
        return token
    }

    public async validateTokenForNewUserToSetPasswordAndGetUserId(token: string): Promise<string> {
        let userId: string
        await verify(
            token,
            this.configService.getOrThrow<string>(EnvVariableName.JWT_SECRET),
            async (err, payload: any) => {
                if (err || payload === undefined) {
                    throw new ForbiddenException()
                }
                userId = payload.user_id
            },
        )
        return userId
    }
}
