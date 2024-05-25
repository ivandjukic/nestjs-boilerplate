import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm'
import { UserEntity } from '../../user/entities/user.entity'

@Entity({ name: 'projects' })
export class ProjectEntity {
    @PrimaryGeneratedColumn({})
    id: string

    @Column({})
    name: string

    @Column({})
    description: string

    @Column({})
    user_id: string

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'user_id' })
    user: UserEntity

    @CreateDateColumn({})
    created_at: string

    @UpdateDateColumn({})
    updated_at: string

    @DeleteDateColumn({})
    deleted_at?: string
}
