import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

export class CreateProjectRequestDto {
    @ApiProperty({
        name: 'name',
        type: 'string',
        required: true,
        example: 'Project name',
        maxLength: 255,
    })
    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    name: string

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
