import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { QueryRunner, Repository } from 'typeorm'
import { OrganizationEntity } from './entities/organization.entity'
import { UpdateOrganizationDetailsRequestDto } from './dtos/update-organization-details-request.dto'

@Injectable()
export class OrganizationService {
    constructor(
        @InjectRepository(OrganizationEntity)
        private readonly repository: Repository<OrganizationEntity>,
    ) {}

    public async create(name: string): Promise<OrganizationEntity> {
        return this.repository.save({ name })
    }

    public async createThreadSafe(name: string, queryRunner: QueryRunner): Promise<OrganizationEntity> {
        return queryRunner.manager.save(OrganizationEntity, {
            name,
        })
    }

    public async findById(id: string): Promise<OrganizationEntity | null> {
        return this.repository.findOne({ where: { id } })
    }

    public async update(id: string, payload: UpdateOrganizationDetailsRequestDto): Promise<OrganizationEntity> {
        const organization = await this.findById(id)
        if (!organization) {
            throw new NotFoundException()
        }
        await this.repository.update(id, {
            name: payload.name ?? organization.name,
        })
        return this.findById(id)
    }
}
