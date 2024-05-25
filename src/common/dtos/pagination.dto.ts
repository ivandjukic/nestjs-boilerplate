import { ApiProperty } from '@nestjs/swagger'

export class PaginationDto {
    @ApiProperty({
        type: 'number',
        name: 'per_page',
        example: 20,
        required: true,
    })
    per_page: number

    @ApiProperty({
        type: 'number',
        name: 'total_pages',
        example: 5,
        required: true,
    })
    total_pages: number

    @ApiProperty({
        type: 'number',
        name: 'total_items',
        example: 100,
        required: true,
    })
    total_items: number

    @ApiProperty({
        type: 'number',
        name: 'current_page',
        example: 1,
        required: true,
    })
    current_page: number

    @ApiProperty({
        type: 'number',
        name: 'previous_page',
        example: 1,
        nullable: true,
        default: null,
    })
    previous_page: number | null

    @ApiProperty({
        type: 'number',
        name: 'next_page',
        example: 1,
        nullable: true,
        default: null,
    })
    next_page: number | null
}
