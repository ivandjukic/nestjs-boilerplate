import { SetMetadata } from '@nestjs/common'
import { RoleName } from '../../modules/role/enums/RoleName'
import { REQUIRED_ROLES_METADATA_KEY } from '../guards/user-role.guard'

export const RequiredRoles = (roles: RoleName[]) => {
    return SetMetadata(REQUIRED_ROLES_METADATA_KEY, roles)
}
