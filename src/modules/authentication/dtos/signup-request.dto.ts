import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class SignupRequestDto {
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
        name: 'first_name',
        type: 'string',
        example: 'John',
        required: true,
        maxLength: 100,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    first_name: string

    @ApiProperty({
        name: 'last_name',
        type: 'string',
        example: 'Doe',
        required: true,
        maxLength: 100,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    last_name: string

    @ApiProperty({
        name: 'organization_name',
        type: 'string',
        example: 'Acme Inc.',
        required: false,
        maxLength: 255,
    })
    @IsString()
    @IsOptional()
    @MaxLength(255)
    organization_name?: string
}
