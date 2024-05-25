import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { QueryRunner, Repository } from 'typeorm'
import { RoleEntity } from './entities/role.entity'
import { UserRoleEntity } from './entities/user-role.entity'
import { UserEntity } from '../user/entities/user.entity'
import { RoleName } from './enums/RoleName'

@Injectable()
export class RoleService {
    constructor(
        @InjectRepository(RoleEntity)
        private readonly roleRepository: Repository<RoleEntity>,
        @InjectRepository(UserRoleEntity)
        private readonly userRoleRepository: Repository<UserRoleEntity>,
    ) {}

    public async findRoleByName(name: RoleName): Promise<RoleEntity | null> {
        return this.roleRepository.findOne({ where: { name } })
    }

    public async findAllByUserId(userId: string): Promise<UserRoleEntity[]> {
        return this.userRoleRepository.find({
            where: {
                user_id: userId,
            },
        })
    }

    public async updateUserRoles(user: UserEntity, roleNames: RoleName[]): Promise<void> {
        await this.revokeAllRolesByUserId(user.id)
        await Promise.all(
            roleNames.map(async (roleName: RoleName) => {
                const role = await this.findRoleByName(roleName)
                return this.userRoleRepository.save({
                    user_id: user.id,
                    role_id: role.id,
                })
            }),
        )
    }

    async setUserRolesThreadSafe(user: UserEntity, roleNames: RoleName[], queryRunner: QueryRunner): Promise<void> {
        await Promise.all(
            roleNames.map(async (roleName: RoleName) => {
                const role = await this.findRoleByName(roleName)
                return queryRunner.manager.save(UserRoleEntity, {
                    user_id: user.id,
                    role_id: role.id,
                })
            }),
        )
    }

    public async setUserRoles(user: UserEntity, roleNames: RoleName[]): Promise<void> {
        await this.revokeAllRolesByUserId(user.id)
        await Promise.all(
            roleNames.map(async (roleName: RoleName) => {
                const role = await this.findRoleByName(roleName)
                return this.userRoleRepository.save({
                    user_id: user.id,
                    role_id: role.id,
                })
            }),
        )
    }

    private async revokeAllRolesByUserId(userId: string): Promise<void> {
        const roles = await this.findAllByUserId(userId)
        await this.userRoleRepository.remove(roles)
    }
}
