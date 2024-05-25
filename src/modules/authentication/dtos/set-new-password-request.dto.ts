import { IsNotEmpty, IsString, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class SetNewPasswordRequestDto {
    @ApiProperty({
        name: 'password',
        type: 'string',
        example: 'new_password',
        required: true,
    })
    @MinLength(8)
    @IsNotEmpty()
    @IsString()
    password: string

    @ApiProperty({
        name: 'forgot_password_hash',
        type: 'string',
        example: '7dc7baf04690e8f38aef40e7a91adec59c41715f731771b9a5eb703c457ac31bbe4681d96b17b9535ac7861f1618bd8cc175',
        required: true,
    })
    @IsNotEmpty()
    @IsString()
    forgot_password_hash: string
}
