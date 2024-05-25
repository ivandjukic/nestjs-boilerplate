import { Column, CreateDateColumn, Entity, ManyToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { UserEntity } from '../../user/entities/user.entity'
import { RoleName } from '../enums/RoleName'

@Entity({ name: 'roles' })
export class RoleEntity {
    @PrimaryGeneratedColumn({})
    id: string

    @Column({})
    name: RoleName

    @CreateDateColumn({})
    created_at: string

    @UpdateDateColumn({})
    updated_at: string

    @ManyToMany(() => UserEntity, (user) => user.roles)
    users?: UserEntity[]
}
