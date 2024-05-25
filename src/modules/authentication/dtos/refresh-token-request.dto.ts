import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class RefreshTokenRequestDto {
    @ApiProperty({
        name: 'refresh_token',
        type: 'string',
        example:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImRkNjRkMGUwLTI0N2MtNDI5My04N2EwLTllYTY5Nzg0ZTFlNyIsInJlbWVtYmVyTWUiOmZhbHNlLCJpYXQiOjE3MDg5NDI1NTQsImV4cCI6MTcwODk0NDM1NH0.bCqb1MZKiPZE-hri3f9Gy1IlkYgJ_qBcOY2stTtG0BY',
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    refresh_token: string
}
