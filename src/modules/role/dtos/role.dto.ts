import { ApiProperty } from '@nestjs/swagger'
import { RoleName } from '../enums/RoleName'

export class RoleDto {
    @ApiProperty({
        name: 'name',
        type: 'string',
        example: RoleName.ADMIN,
    })
    name: string
}
