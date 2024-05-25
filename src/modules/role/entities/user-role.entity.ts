import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm'
import { RoleEntity } from './role.entity'
import { UserEntity } from '../../user/entities/user.entity'

@Entity({ name: 'user_roles' })
export class UserRoleEntity {
    @PrimaryColumn({})
    id: string

    @Column({})
    user_id: string

    @Column({})
    role_id: string

    @CreateDateColumn({})
    created_at?: Date | string

    @UpdateDateColumn({})
    updated_at?: Date | string

    @ManyToOne(() => RoleEntity, (role) => role.users)
    @JoinColumn([{ name: 'role_id', referencedColumnName: 'id' }])
    roles: RoleEntity[]

    @ManyToOne(() => UserRoleEntity, (user) => user.roles)
    @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
    users: UserEntity[]
}
