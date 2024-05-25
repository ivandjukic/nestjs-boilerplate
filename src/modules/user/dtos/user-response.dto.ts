import { ApiProperty } from '@nestjs/swagger'
import { OrganizationDto } from '../../organization/dtos/organization.dto'
import { RoleName } from '../../role/enums/RoleName'

export class UserResponseDto {
    @ApiProperty({
        name: 'id',
        type: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    id: string

    @ApiProperty({
        name: 'email',
        type: 'string',
        example: 'me@example.com',
    })
    email: string

    @ApiProperty({
        name: 'first_name',
        type: 'string',
        example: 'John',
    })
    first_name: string

    @ApiProperty({
        name: 'last_name',
        type: 'string',
        example: 'Doe',
    })
    last_name: string

    @ApiProperty({
        name: 'created_at',
        type: 'string',
        example: '2021-01-01T00:00:00.000Z',
    })
    created_at: string

    @ApiProperty({
        name: 'organization',
        type: () => OrganizationDto,
    })
    organization?: OrganizationDto

    @ApiProperty({
        name: 'roles',
        type: 'string',
        isArray: true,
    })
    roles?: RoleName[]
}
