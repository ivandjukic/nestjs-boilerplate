import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { QueryRunner, Repository } from 'typeorm'
import { ProjectEntity } from './entities/project.entity'
import { CreateProjectData } from './types/CreateProjectData'
import { UpdateProjectData } from './types/UpdateProjectData'
import { ProjectEntityRelation } from './enums/ProjectEntityRelation'
import { PaginationQueryRequestDto } from '../../common/dtos/pagination-query-request.dto'
import { getPagination } from '../../common/utils/pagination'
import { ProjectWithTheSameNameAlreadyExists } from './errors/ProjectWithTheSameNameAlreadyExists'
import { ProjectsWithPagination } from './types/ProjectsWithPagination'

@Injectable()
export class ProjectService {
    constructor(
        @InjectRepository(ProjectEntity)
        private readonly repository: Repository<ProjectEntity>,
    ) {}

    public async create(data: CreateProjectData): Promise<ProjectEntity> {
        const projectExists = await this.findByNameAndUserId(data.name, data.userId)
        if (projectExists) {
            throw new ProjectWithTheSameNameAlreadyExists()
        }
        return this.repository.save({
            user_id: data.userId,
            name: data.name,
            description: data.description,
        })
    }

    public async createThreadSafe(data: CreateProjectData, queryRunner: QueryRunner): Promise<ProjectEntity> {
        return queryRunner.manager.save(ProjectEntity, {
            user_id: data.userId,
            name: data.name,
            description: data.description,
        })
    }

    public async findById(id: string, relations: ProjectEntityRelation[] = []): Promise<ProjectEntity | null> {
        return this.repository.findOne({ where: { id }, relations })
    }

    public async findAllByUserId(userId: string, relations: ProjectEntityRelation[] = []): Promise<ProjectEntity[]> {
        return this.repository.find({ where: { user_id: userId }, relations })
    }

    public async findByUserId(userId: string, query?: PaginationQueryRequestDto): Promise<ProjectsWithPagination> {
        const page = Number(query?.page ?? 1)
        const perPage = Number(query?.per_page ?? 20)

        const [projects, count] = await this.repository.findAndCount({
            where: { user_id: userId },
            take: perPage,
            skip: (page - 1) * perPage,
            order: { created_at: 'DESC' },
        })

        return {
            projects,
            pagination: getPagination(page, perPage, count),
        }
    }

    public async update(data: UpdateProjectData): Promise<void> {
        const project = await this.repository.findOne({ where: { id: data.id, user_id: data.userId } })
        if (!project) {
            throw new NotFoundException('Project not found')
        }
        await this.repository.update(
            { id: data.id },
            {
                name: data.name,
                description: data.description,
            },
        )
    }

    private async findByNameAndUserId(name: string, userId: string): Promise<ProjectEntity | null> {
        return this.repository.findOne({ where: { name, user_id: userId } })
    }

    public async getNumberOfProjectsByUserId(userId: string): Promise<number> {
        return this.repository.count({ where: { user_id: userId } })
    }
}
