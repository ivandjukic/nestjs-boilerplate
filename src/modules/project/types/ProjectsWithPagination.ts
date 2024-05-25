import { ProjectEntity } from '../entities/project.entity'
import { PaginationDto } from '../../../common/dtos/pagination.dto'

export interface ProjectsWithPagination {
    projects: ProjectEntity[]
    pagination: PaginationDto
}
