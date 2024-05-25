import { ApiProperty } from '@nestjs/swagger'
import { IsNumber, IsOptional, Min } from 'class-validator'
import { Transform } from 'class-transformer'

export class PaginationQueryRequestDto {
    @ApiProperty({
        name: 'page',
        type: 'number',
        example: 1,
        required: false,
        default: 1,
    })
    @Transform(({ value }) => Number(value))
    @IsOptional()
    @IsNumber()
    @Min(1)
    page?: number

    @ApiProperty({
        name: 'per_page',
        type: 'number',
        example: 20,
        required: false,
        default: 20,
    })
    @Transform(({ value }) => Number(value))
    @IsOptional()
    @IsNumber()
    @Min(1)
    per_page?: number
}
