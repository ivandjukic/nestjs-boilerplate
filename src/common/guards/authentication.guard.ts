import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { verify } from 'jsonwebtoken'
import { promisify } from 'util'
import { EnvVariableName } from '../enums/EnvVariableName'
import { UserService } from '../../modules/user/user.service'
import { UserEntityRelation } from '../../modules/user/enums/UserEntityRelation'

@Injectable()
export class AuthenticationGuard implements CanActivate {
    constructor(
        private readonly configService: ConfigService,
        private readonly userService: UserService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest()
        const authorizationHeader = request.headers.authorization
        if (!authorizationHeader) {
            throw new UnauthorizedException()
        }

        const token = authorizationHeader.split(' ')[1]
        if (!token) {
            throw new UnauthorizedException()
        }

        const secret = this.configService.get<string>(EnvVariableName.JWT_SECRET, '')

        const verifyAsync = promisify(verify)
        try {
            // @ts-expect-error
            const payload: any = await verifyAsync(token, secret)
            if (!payload) {
                throw new UnauthorizedException()
            }

            const user = await this.userService.findById(payload.id, [
                UserEntityRelation.ORGANIZATION,
                UserEntityRelation.ROLES,
            ])

            if (!user) {
                throw new UnauthorizedException()
            }

            request.user = user
            return true
        } catch (e) {
            throw new UnauthorizedException()
        }
    }
}
