import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { UserEntity } from '../../user/entities/user.entity'

@Entity({ name: 'audit_logs' })
export class AuditLogEntity {
    @PrimaryGeneratedColumn({})
    id: string

    @Column({})
    ip: string

    @Column({})
    action: string

    @Column({})
    status_code: number

    @Column({ type: 'jsonb' })
    parameters: Record<string, any>

    @Column({})
    user_id?: string

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'user_id' })
    user: UserEntity

    @Column({})
    error?: string

    @CreateDateColumn({})
    created_at: string
}
