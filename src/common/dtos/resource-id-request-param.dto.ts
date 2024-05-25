import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsUUID } from 'class-validator'

export class ResourceIdRequestParamDto {
    @ApiProperty({
        type: 'number',
        name: 'per_page',
        example: 20,
        required: true,
    })
    @IsNotEmpty()
    @IsUUID()
    id: string
}
