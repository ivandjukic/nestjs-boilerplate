import { ApiProperty } from '@nestjs/swagger'

export class ProjectMetadataDto {
    @ApiProperty({
        name: 'number_of_episodes',
        type: 'number',
        example: 10,
        required: false,
    })
    number_of_episodes?: number
}
