import { IsBoolean, IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class IsForgotPasswordRequestHashValidResponseDto {
    @ApiProperty({
        name: 'is_valid',
        type: 'boolean',
        example: false,
    })
    @IsNotEmpty()
    @IsBoolean()
    is_valid: boolean
}
