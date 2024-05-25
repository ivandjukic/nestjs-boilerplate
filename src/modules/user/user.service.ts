import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { QueryRunner, Repository } from 'typeorm'
import { UserEntity } from './entities/user.entity'
import { CreateUserData } from './types/CreateUserData'
import { UserEntityRelation } from './enums/UserEntityRelation'
import { hashSecret } from '../../common/utils/hashSecret'
import { randomUUID } from 'crypto'

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly repository: Repository<UserEntity>,
    ) {}

    public async create(payload: CreateUserData): Promise<UserEntity> {
        return this.repository.save({
            email: payload.email,
            password: payload.password,
            first_name: payload.firstName,
            last_name: payload.lastName,
            organization_id: payload.organizationId,
        })
    }

    public async createThreadSafe(payload: CreateUserData, queryRunner: QueryRunner): Promise<UserEntity> {
        return queryRunner.manager.save(UserEntity, {
            email: payload.email,
            password: payload.password,
            first_name: payload.firstName,
            last_name: payload.lastName,
            organization_id: payload.organizationId,
        })
    }

    public async findByEmail(email: string, relations: UserEntityRelation[] = []): Promise<UserEntity | null> {
        return this.repository.findOne({ where: { email }, relations })
    }

    public async findByEmailThreadSafe(email: string, queryRunner: QueryRunner): Promise<UserEntity | null> {
        return queryRunner.manager.findOne(UserEntity, { where: { email } })
    }

    public async findById(id: string, relations: UserEntityRelation[] = []): Promise<UserEntity | null> {
        return this.repository.findOne({ where: { id }, relations })
    }

    public async findByIdWithDeleted(id: string): Promise<UserEntity | null> {
        return this.repository.findOne({ where: { id }, withDeleted: true })
    }

    public async confirmUser(userId: string): Promise<void> {
        await this.repository.update({ id: userId }, { confirmed_at: new Date().toISOString() })
    }

    public async getNumberOfUsers(): Promise<number> {
        return this.repository.count()
    }

    public async invalidatePasswordThreadSafe(userId: string, queryRunner: QueryRunner): Promise<void> {
        await queryRunner.manager.save(UserEntity, { id: userId, password: hashSecret(randomUUID()) })
    }

    public async setNewPassword(userId: string, password: string): Promise<void> {
        await this.repository.update({ id: userId }, { password })
    }

    public async softDeleteUser(userId: string): Promise<void> {
        await this.repository.softDelete({ id: userId })
    }
}
