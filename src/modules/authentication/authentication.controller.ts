import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    ForbiddenException,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Res,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common'
import { AuthenticationService } from './authentication.service'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { SignupRequestDto } from './dtos/signup-request.dto'
import { AccountVerificationHashExpired } from './errors/AccountVerificationHashExpired'
import { SigninRequestDto } from './dtos/signin-request.dto'
import { SuccessfullySignedInResponseDto } from './dtos/successfully-signedin-response.dto'
import { Response } from 'express'
import { SwaggerTag } from '../../common/enums/SwaggerTag'
import { EmptyResponseDto } from '../../common/dtos/EmptyResponseDto'
import { RefreshTokenRequestDto } from './dtos/refresh-token-request.dto'
import { AuthenticationGuard } from '../../common/guards/authentication.guard'
import { ForgotPasswordRequestDto } from './dtos/forgot-password-request.dto'
import { IsForgotPasswordRequestHashValidResponseDto } from './dtos/is-forgot-password-request-hash-valid-response.dto'
import { UpdatePasswordRequestDto } from './dtos/update-password-request.dto'
import { SetNewPasswordRequestDto } from './dtos/set-new-password-request.dto'
import { User } from '../../common/decorators/User'
import { UserEntity } from '../user/entities/user.entity'
import { SetAuditLogActionName } from '../../common/decorators/AuditLogActionName'
import { AuditLogActionName } from '../../common/enums/AuditLogActionName'
import { AuditLoggerInterceptor } from '../../common/interceptors/audit-logger/audit-logger.interceptor'

@Controller('auth')
@ApiTags(SwaggerTag.AUTHENTICATION)
@UseInterceptors(ClassSerializerInterceptor)
export class AuthenticationController {
    constructor(private readonly service: AuthenticationService) {}

    @Post('/signup')
    @Post('/')
    @ApiOperation({ summary: 'Sign up' })
    @ApiBody({ type: SignupRequestDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Successfully signed up',
        type: EmptyResponseDto,
    })
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(AuditLoggerInterceptor)
    @SetAuditLogActionName(AuditLogActionName.SIGN_UP)
    async signUpRequest(@Body() payload: SignupRequestDto): Promise<void> {
        return this.service.signUp(payload)
    }

    @Get('/confirm-email/:hash')
    @ApiOperation({ summary: 'Confirm email' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Account successfully confirmed',
        type: EmptyResponseDto,
    })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Account verification hash expired' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN })
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(AuditLoggerInterceptor)
    @SetAuditLogActionName(AuditLogActionName.CONFIRM_EMAIL)
    async confirmEmail(@Param('hash') hash: string): Promise<void> {
        try {
            await this.service.confirmEmail(hash)
        } catch (error) {
            if (error instanceof AccountVerificationHashExpired) {
                throw new ForbiddenException('Account verification hash expired')
            }
            throw error
        }
    }

    @Post('/signin')
    @ApiOperation({ summary: 'Sign in' })
    @ApiBody({ type: SigninRequestDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Successfully signed in',
        type: SuccessfullySignedInResponseDto,
    })
    @ApiResponse({ status: HttpStatus.FORBIDDEN })
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(AuditLoggerInterceptor)
    @SetAuditLogActionName(AuditLogActionName.SIGN_IN, ['email'])
    async signInRequest(@Body() payload: SigninRequestDto): Promise<SuccessfullySignedInResponseDto> {
        const signInResult = await this.service.signIn(payload)
        return {
            jwt_token: signInResult.jwtToken,
            refresh_token: signInResult.refreshToken,
            remember_me: signInResult.rememberMe,
            jwt_token_expires_in: signInResult.jwtTokenExpiresIn,
            refresh_token_expires_in: signInResult.refreshTokenExpiresIn,
        }
    }

    @Post('/refresh-token')
    @ApiOperation({ summary: 'Refresh token' })
    @ApiBody({ type: RefreshTokenRequestDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Successfully refreshed token',
        type: SuccessfullySignedInResponseDto,
    })
    @HttpCode(HttpStatus.OK)
    async refreshTokenRequest(@Body() payload: RefreshTokenRequestDto): Promise<SuccessfullySignedInResponseDto> {
        const signInResult = await this.service.refreshToken(payload.refresh_token)
        return {
            jwt_token: signInResult.jwtToken,
            refresh_token: signInResult.refreshToken,
            remember_me: signInResult.rememberMe,
            jwt_token_expires_in: signInResult.jwtTokenExpiresIn,
            refresh_token_expires_in: signInResult.refreshTokenExpiresIn,
        }
    }

    @Post('/forgot-password')
    @ApiOperation({ summary: 'Forgot password -> Start forgot password flow' })
    @ApiBody({ type: ForgotPasswordRequestDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Successfully sent forgot password email',
        type: EmptyResponseDto,
    })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request.' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(AuditLoggerInterceptor)
    @SetAuditLogActionName(AuditLogActionName.FORGOT_PASSWORD, ['email'])
    async forgotPassword(@Body() payload: ForgotPasswordRequestDto): Promise<void> {
        return await this.service.handleForgotPasswordRequest({
            email: payload.email,
        })
    }

    @Get('/forgot-password/:hash')
    @ApiOperation({ summary: 'Validate forgot password request hash -> Confirm forgot password request' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Successfully validated forgot password request hash',
        type: IsForgotPasswordRequestHashValidResponseDto,
    })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request.' })
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(AuditLoggerInterceptor)
    @SetAuditLogActionName(AuditLogActionName.VALIDATE_FORGOT_PASSWORD_HASH)
    async validateForgotPasswordRequestHash(
        @Param('hash') hash: string,
    ): Promise<IsForgotPasswordRequestHashValidResponseDto> {
        return {
            is_valid: await this.service.isForgotPasswordRequestHashValid(hash),
        }
    }

    @Post('/set-new-password')
    @ApiOperation({ summary: 'Set new password -> finish forgot password flow' })
    @ApiBody({ type: SetNewPasswordRequestDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Successfully updated password',
        type: EmptyResponseDto,
    })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request.' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(AuditLoggerInterceptor)
    @SetAuditLogActionName(AuditLogActionName.SET_NEW_PASSWORD)
    async setNewPassword(@Body() payload: SetNewPasswordRequestDto): Promise<void> {
        return await this.service.setNewPassword(payload)
    }

    @Post('/password')
    @ApiOperation({ summary: 'Update password' })
    @ApiBody({ type: UpdatePasswordRequestDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Successfully updated password',
        type: EmptyResponseDto,
    })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request.' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Old password is incorrect.' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'New password cannot be the same as the old password.' })
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthenticationGuard)
    @ApiBearerAuth()
    @UseInterceptors(AuditLoggerInterceptor)
    @SetAuditLogActionName(AuditLogActionName.UPDATE_PASSWORD)
    async updatePassword(@Body() payload: UpdatePasswordRequestDto, @User() user: UserEntity): Promise<void> {
        return await this.service.updatePassword(user, payload)
    }

    @Post('/signout')
    @ApiOperation({ summary: 'Sign out' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Successfully signed out',
        type: EmptyResponseDto,
    })
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthenticationGuard)
    async signOutRequest(@Res() res: Response): Promise<void> {
        res.clearCookie('jwt_token', {
            httpOnly: true,
            secure: true,
        })
        res.clearCookie('refresh_token', {
            httpOnly: true,
            secure: true,
        })
        res.clearCookie('remember_me', {
            httpOnly: true,
            secure: true,
        })
        res.status(HttpStatus.OK).json({})
    }
}
