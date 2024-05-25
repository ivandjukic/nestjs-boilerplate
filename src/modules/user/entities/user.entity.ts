import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm'
import { Exclude } from 'class-transformer'
import { OrganizationEntity } from '../../organization/entities/organization.entity'
import { RoleEntity } from '../../role/entities/role.entity'

@Entity({ name: 'users' })
export class UserEntity {
    @PrimaryGeneratedColumn({})
    id: string

    @Column({})
    email: string

    @Column({})
    @Exclude({ toPlainOnly: true })
    password: string

    @Column({})
    first_name: string

    @Column({})
    last_name: string

    @Column({})
    organization_id: string

    @ManyToOne(() => OrganizationEntity)
    @JoinColumn({ name: 'organization_id' })
    organization: OrganizationEntity

    @CreateDateColumn({})
    created_at: string

    @UpdateDateColumn({})
    updated_at: string

    @Column({})
    confirmed_at?: string | null

    @DeleteDateColumn({})
    deleted_at?: string | null

    @ManyToMany(() => RoleEntity, (role) => role.users)
    @JoinTable({
        name: 'user_roles', // Name of the join table
        joinColumn: {
            name: 'user_id',
            referencedColumnName: 'id',
        },
        inverseJoinColumn: {
            name: 'role_id',
            referencedColumnName: 'id',
        },
    })
    roles: RoleEntity[]
}
