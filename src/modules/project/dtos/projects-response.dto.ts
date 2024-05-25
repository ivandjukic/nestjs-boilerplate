import { ApiProperty } from '@nestjs/swagger'
import { ProjectDto } from './project.dto'
import { PaginationDto } from '../../../common/dtos/pagination.dto'

export class ProjectsResponseDto {
    @ApiProperty({
        name: 'projects',
        type: () => ProjectDto,
        isArray: true,
    })
    projects: ProjectDto[]

    @ApiProperty({
        name: 'pagination',
        type: () => PaginationDto,
    })
    pagination: PaginationDto
}
