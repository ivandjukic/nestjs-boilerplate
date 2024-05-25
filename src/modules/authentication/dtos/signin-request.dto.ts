import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class SigninRequestDto {
    @ApiProperty({
        name: 'email',
        type: 'string',
        example: 'me@example.com',
        required: true,
        maxLength: 255,
    })
    @IsEmail()
    @IsNotEmpty()
    @MaxLength(255)
    email: string

    @ApiProperty({
        name: 'password',
        type: 'string',
        example: 'password',
        required: true,
        maxLength: 255,
        minLength: 8,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    @MinLength(8)
    password: string

    @ApiProperty({
        name: 'remember_me',
        type: 'boolean',
        example: false,
    })
    @IsOptional()
    @IsBoolean()
    remember_me?: boolean
}
