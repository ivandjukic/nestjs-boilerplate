import { IsEmail, IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class ForgotPasswordRequestDto {
    @ApiProperty({
        name: 'email',
        type: 'string',
        example: 'email@email.com',
    })
    @IsNotEmpty()
    @IsEmail()
    email: string
}
