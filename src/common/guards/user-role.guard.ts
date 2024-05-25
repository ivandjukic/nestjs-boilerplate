import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { RoleName } from '../../modules/role/enums/RoleName'
import { UserEntity } from '../../modules/user/entities/user.entity'
import { RoleEntity } from '../../modules/role/entities/role.entity'

export const REQUIRED_ROLES_METADATA_KEY = 'requiredRole'

@Injectable()
export class UserRoleGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles: RoleName[] = this.reflector.get<RoleName[]>(
            REQUIRED_ROLES_METADATA_KEY,
            context.getHandler(),
        )
        if (!requiredRoles || requiredRoles.length == 0) {
            throw new Error('UserRole is required')
        }

        const user: UserEntity | undefined = context.switchToHttp().getRequest().user
        if (!user) {
            throw new UnauthorizedException()
        }
        if (user.roles?.some((role: RoleEntity) => requiredRoles.includes(role.name))) {
            return true
        } else {
            throw new ForbiddenException('User does not have required roles to access this resource.')
        }
    }
}
