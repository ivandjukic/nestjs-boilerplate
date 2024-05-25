import { IsNotEmpty, IsString, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class UpdatePasswordRequestDto {
    @ApiProperty({
        name: 'old_password',
        type: 'string',
        example: 'old_password',
        required: true,
    })
    @MinLength(8)
    @IsNotEmpty()
    @IsString()
    old_password: string

    @ApiProperty({
        name: 'new_password',
        type: 'string',
        example: 'new_password',
        required: true,
    })
    @MinLength(8)
    @IsNotEmpty()
    @IsString()
    new_password: string
}
