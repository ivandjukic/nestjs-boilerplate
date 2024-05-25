import { ApiProperty } from '@nestjs/swagger'
import { ProjectMetadataDto } from './project-metadata.dto'

export class ProjectDto {
    @ApiProperty({
        name: 'id',
        type: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    id: string

    @ApiProperty({
        name: 'name',
        type: 'string',
        example: 'Demo Project',
    })
    name: string

    @ApiProperty({
        name: 'description',
        type: 'string',
        example: 'This is a demo project',
    })
    description?: string

    @ApiProperty({
        name: 'created_at',
        type: 'string',
        example: '2021-01-01T00:00:00.000Z',
    })
    created_at?: string

    @ApiProperty({
        type: () => ProjectMetadataDto,
    })
    metadata?: ProjectMetadataDto
}
