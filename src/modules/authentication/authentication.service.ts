import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common'
import { UserService } from '../user/user.service'
import { SignupRequestDto } from './dtos/signup-request.dto'
import { hashSecret } from '../../common/utils/hashSecret'
import { ConfigService } from '@nestjs/config'
import { EnvVariableName } from '../../common/enums/EnvVariableName'
import { SignupError } from './errors/SignupError'
import { JwtService } from '../jwt/jwt.service'
import { UserEntity } from '../user/entities/user.entity'
import { SigninRequestDto } from './dtos/signin-request.dto'
import { SuccessfullySignedInData } from './types/SuccessfullySignedInData'
import { OrganizationService } from '../organization/organization.service'
import { DataSource, QueryRunner, Repository } from 'typeorm'
import { RoleService } from '../role/role.service'
import { RoleName } from '../role/enums/RoleName'
import { Logger } from '../logger/logger'
import { promisify } from 'util'
import { verify } from 'jsonwebtoken'
import { ProjectService } from '../project/project.service'
import { ForgotPasswordRequestDto } from './dtos/forgot-password-request.dto'
import { UserEntityRelation } from '../user/enums/UserEntityRelation'
import { UpdatePasswordRequestDto } from './dtos/update-password-request.dto'
import { InjectRepository } from '@nestjs/typeorm'
import { ForgotPasswordRequestEntity } from '../forgot-password/entities/forgot-password.entity'
import * as moment from 'moment'
import { EmailService } from '../email/email.service'
import { timeStringToMilliseconds } from '../../common/utils/timeStringToMilliseconds'
import { SetNewPasswordRequestDto } from './dtos/set-new-password-request.dto'

@Injectable()
export class AuthenticationService {
    constructor(
        private readonly userService: UserService,
        private readonly configService: ConfigService,
        private readonly emailService: EmailService,
        private readonly jwtService: JwtService,
        private readonly organizationService: OrganizationService,
        private readonly roleService: RoleService,
        private readonly dataSource: DataSource,
        private readonly logger: Logger,
        private readonly projectService: ProjectService,
        @InjectRepository(ForgotPasswordRequestEntity)
        private readonly forgotPasswordRequestEntityRepository: Repository<ForgotPasswordRequestEntity>,
    ) {}

    public async signUp(payload: SignupRequestDto): Promise<void> {
        const userExists = await this.userService.findByEmail(payload.email)
        if (userExists) {
            // this means that the user already exists
            // we don't want to expose this information to the client by throwing an error
            // instead we will just return a 200 status code
            this.logger.error(`Signup attempt with existing email: ${payload.email}`)
            return
        } else {
            const queryRunner = this.dataSource.createQueryRunner()
            try {
                await queryRunner.startTransaction()
                const organizationName = payload?.organization_name ?? `${payload?.first_name} ${payload?.last_name}`
                const organization = await this.organizationService.createThreadSafe(organizationName, queryRunner)
                const user = await this.userService.createThreadSafe(
                    {
                        firstName: payload.first_name,
                        lastName: payload.last_name,
                        email: payload.email,
                        password: await this.hashPassword(payload.password),
                        organizationId: organization.id,
                    },
                    queryRunner,
                )
                await this.roleService.setUserRolesThreadSafe(user, [RoleName.ADMIN], queryRunner)
                await this.sendVerificationEmail(user)
                // create a default project for the user
                await this.projectService.createThreadSafe(
                    {
                        userId: user.id,
                        name: 'Default Project',
                    },
                    queryRunner,
                )
                await queryRunner.commitTransaction()
            } catch (error) {
                this.logger.error('Error occurred while creating the user', error)
                await queryRunner.rollbackTransaction()
                throw new SignupError('An error occurred while creating the user')
            } finally {
                await queryRunner.release()
            }
        }
    }

    public async confirmEmail(hash: string): Promise<void> {
        const userId = await this.jwtService.findUserIdFromAccountVerificationHash(hash)
        const user = await this.userService.findById(userId)
        if (user && !user.confirmed_at) {
            await this.userService.confirmUser(userId)
        } else {
            this.logger.log(`User with id ${userId} not found or already confirmed`)
        }
    }

    public async signIn(payload: SigninRequestDto): Promise<SuccessfullySignedInData> {
        const user = await this.userService.findByEmail(payload.email)
        if (!user || !user.confirmed_at) {
            throw new ForbiddenException()
        }
        const isPasswordValid = this.isPasswordValid(user, payload.password)
        if (!isPasswordValid) {
            throw new ForbiddenException()
        }

        const jwtTokenExpiresIn = this.configService.getOrThrow<string>(EnvVariableName.JWT_TOKEN_EXPIRES_IN, '30m')

        const refreshTokenExpiresIn = payload?.remember_me
            ? '31d'
            : this.configService.getOrThrow<string>(EnvVariableName.JWT_REFRESH_TOKEN_EXPIRES_IN, '1d')

        return {
            jwtToken: this.jwtService.generateAccessToken(user, jwtTokenExpiresIn, payload.remember_me ?? false),
            refreshToken: this.jwtService.generateRefreshToken(
                user.id,
                refreshTokenExpiresIn,
                payload.remember_me ?? false,
            ),
            rememberMe: payload?.remember_me ?? false,
            jwtTokenExpiresIn: timeStringToMilliseconds(jwtTokenExpiresIn),
            refreshTokenExpiresIn: timeStringToMilliseconds(refreshTokenExpiresIn),
        }
    }

    public async refreshToken(refreshToken: string): Promise<any> {
        const secret = this.configService.getOrThrow<string>(EnvVariableName.JWT_SECRET, '')
        let user: UserEntity
        let rememberMe: boolean
        const verifyAsync = promisify(verify)
        try {
            // @ts-expect-error
            const payload: any = await verifyAsync(refreshToken, secret)
            if (!payload) {
                throw new UnauthorizedException()
            }

            user = await this.userService.findById(payload.id)
            rememberMe = payload.rememberMe
            if (!user) {
                throw new UnauthorizedException()
            }
        } catch (e) {
            throw new UnauthorizedException()
        }

        if (!user || !user.confirmed_at) {
            throw new ForbiddenException()
        }

        const jwtTokenExpiresIn = this.configService.getOrThrow<string>(EnvVariableName.JWT_TOKEN_EXPIRES_IN, '30m')

        const refreshTokenExpiresIn = rememberMe
            ? '31d'
            : this.configService.getOrThrow<string>(EnvVariableName.JWT_REFRESH_TOKEN_EXPIRES_IN, '1d')

        return {
            jwtToken: this.jwtService.generateAccessToken(user, jwtTokenExpiresIn, rememberMe ?? false),
            refreshToken: this.jwtService.generateRefreshToken(user.id, refreshTokenExpiresIn, rememberMe ?? false),
            rememberMe: rememberMe ?? false,
            jwtTokenExpiresIn: timeStringToMilliseconds(jwtTokenExpiresIn),
            refreshTokenExpiresIn: timeStringToMilliseconds(refreshTokenExpiresIn),
        }
    }

    public async hashPassword(password: string): Promise<string> {
        return hashSecret(
            password,
            this.configService.getOrThrow<string>(EnvVariableName.PASSWORD_HASH_SALT),
            Number(this.configService.getOrThrow<number>(EnvVariableName.PASSWORD_HASH_NUMBER_OF_ITERATIONS, 10000)),
        )
    }

    private async sendVerificationEmail(user: UserEntity): Promise<void> {
        const accountConfirmationHash = await this.jwtService.generateHashForAccountVerification(user)

        const subject = `Account Confirmation from [Company Name]`

        await this.emailService.sendEmail(
            [user.email],
            `
                Please click the following link to confirm your account:
                ${accountConfirmationHash}
            `,
            subject,
        )
    }

    private async sendForgotPasswordEmail(user: UserEntity, hash: string): Promise<void> {
        const subject = `forgot password from [Company Name]`

        await this.emailService.sendEmail(
            [user.email],
            `
                Please click the following link to set new password for your account:
                ${hash}
            `,
            subject,
        )
    }

    public async sendSetNewPasswordEmail(user: UserEntity, hash: string): Promise<void> {
        const subject = `Set new password from [Company Name]`

        await this.emailService.sendEmail(
            [user.email],
            `
                Please click the following link to set new password for your account:
                ${hash}
            `,
            subject,
        )
    }

    private isPasswordValid(user: UserEntity, password: string): boolean {
        const passwordHash = hashSecret(
            password,
            this.configService.getOrThrow<string>(EnvVariableName.PASSWORD_HASH_SALT),
            Number(this.configService.getOrThrow<number>(EnvVariableName.PASSWORD_HASH_NUMBER_OF_ITERATIONS)),
        )
        return user.password === passwordHash
    }

    public async handleForgotPasswordRequest(data: ForgotPasswordRequestDto): Promise<void> {
        const user = await this.userService.findByEmail(data.email, [UserEntityRelation.ROLES])
        if (user && user.confirmed_at) {
            const queryRunner = this.dataSource.createQueryRunner()
            try {
                await queryRunner.startTransaction()
                await this.userService.invalidatePasswordThreadSafe(user.id, queryRunner)
                const hash = await this.jwtService.generateHashForAccountVerification(user)
                await this.saveForgotPasswordRequestThreadSafe(user.id, hash, queryRunner)
                await this.sendForgotPasswordEmail(user, hash)
                await queryRunner.commitTransaction()
            } catch (err) {
                await queryRunner.rollbackTransaction()
                throw err
            } finally {
                await queryRunner.release()
            }
        }
    }

    public async isForgotPasswordRequestHashValid(hash: string): Promise<boolean> {
        const forgotPasswordRequest = await this.getForgotPasswordHashByHash(hash)
        const HASH_EXPIRATION_TIME_IN_MINUTES = 30
        return (
            !!forgotPasswordRequest &&
            forgotPasswordRequest.is_valid &&
            moment().diff(moment(forgotPasswordRequest.created_at), 'minutes') < HASH_EXPIRATION_TIME_IN_MINUTES
        )
    }

    public async setNewPassword(setNewPasswordData: SetNewPasswordRequestDto): Promise<void> {
        if (!(await this.isForgotPasswordRequestHashValid(setNewPasswordData.forgot_password_hash))) {
            throw new ForbiddenException()
        }
        const forgotPasswordRequest = await this.getForgotPasswordHashByHash(setNewPasswordData.forgot_password_hash)
        const user = await this.userService.findById(forgotPasswordRequest.user_id)
        if (!user) {
            throw new ForbiddenException()
        }
        await this.userService.setNewPassword(
            forgotPasswordRequest.user_id,
            await this.hashPassword(setNewPasswordData.password),
        )
        await this.invalidateForgotPasswordHashByHash(setNewPasswordData.forgot_password_hash)
    }

    public async saveForgotPasswordRequest(userId: string, hash: string): Promise<ForgotPasswordRequestEntity> {
        return this.forgotPasswordRequestEntityRepository.save({ user_id: userId, hash, is_valid: true })
    }

    public async saveForgotPasswordRequestThreadSafe(
        userId: string,
        hash: string,
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.manager.save(ForgotPasswordRequestEntity, { user_id: userId, hash, is_valid: true })
    }

    public async getForgotPasswordHashByHash(hash: string): Promise<ForgotPasswordRequestEntity | null> {
        return this.forgotPasswordRequestEntityRepository.findOne({
            where: {
                hash,
            },
        })
    }

    public async getForgotPasswordRequestsByUserId(userId: string): Promise<ForgotPasswordRequestEntity[]> {
        return this.forgotPasswordRequestEntityRepository.find({
            where: {
                user_id: userId,
            },
        })
    }

    public async invalidateForgotPasswordHashByHash(hash: string): Promise<void> {
        await this.forgotPasswordRequestEntityRepository.update(
            {
                hash,
            },
            {
                is_valid: false,
            },
        )
    }

    public async updatePassword(user: UserEntity, payload: UpdatePasswordRequestDto): Promise<void> {
        // it should throw an error if the old password is incorrect
        if (!this.isPasswordValid(user, payload.old_password)) {
            throw new ForbiddenException('Old password is incorrect')
        }
        // it should throw an error if the new password is the same as the old password
        if (payload.old_password === payload.new_password) {
            throw new ForbiddenException('New password cannot be the same as the old password')
        }
        await this.userService.setNewPassword(user.id, await this.hashPassword(payload.new_password))
    }
}
