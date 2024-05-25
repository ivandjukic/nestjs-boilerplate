import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString, MaxLength } from 'class-validator'

export class UpdateOrganizationDetailsRequestDto {
    @ApiProperty({
        name: 'name',
        type: 'string',
        maxLength: 255,
        example: 'Acme Inc.',
    })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    name?: string
}
