import { ApiProperty } from '@nestjs/swagger'

export class OrganizationDto {
    @ApiProperty({
        name: 'id',
        type: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    id: string

    @ApiProperty({
        name: 'name',
        type: 'string',
        example: 'Acme Inc.',
    })
    name: string

    @ApiProperty({
        name: 'created_at',
        type: 'string',
        example: '2021-01-01T00:00:00.000Z',
    })
    created_at: string
}
