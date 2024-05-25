import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString, MaxLength } from 'class-validator'

export class UpdateProjectRequestDto {
    @ApiProperty({
        name: 'name',
        type: 'string',
        required: false,
        example: 'Project name',
        maxLength: 255,
    })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    name?: string

    @ApiProperty({
        name: 'description',
        type: 'string',
        required: false,
        example: 'Project description',
    })
    @IsOptional()
    @IsString()
    description?: string
}
