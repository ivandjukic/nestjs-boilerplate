import { ApiProperty } from '@nestjs/swagger'

export class SuccessfullySignedInResponseDto {
    @ApiProperty({
        type: 'string',
        name: 'token',
        example: 'asdadadad',
    })
    jwt_token: string

    @ApiProperty({
        type: 'string',
        name: 'refresh_token',
        example: 'asdasdasdasdas',
    })
    refresh_token: string

    @ApiProperty({
        name: 'remember_me',
        type: 'boolean',
        example: false,
    })
    remember_me: boolean

    @ApiProperty({
        name: 'jwt_token_expires_in',
        type: 'number',
        example: 1800,
    })
    jwt_token_expires_in: number

    @ApiProperty({
        name: 'refresh_token_expires_in',
        type: 'number',
        example: 100000,
    })
    refresh_token_expires_in: number
}
