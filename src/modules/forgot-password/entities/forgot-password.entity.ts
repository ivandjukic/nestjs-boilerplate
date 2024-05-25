import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm'
import { UserEntity } from '../../user/entities/user.entity'

@Entity({ name: 'forgot_password_requests' })
export class ForgotPasswordRequestEntity {
    @PrimaryColumn()
    id!: string

    @Column()
    user_id!: string

    @ManyToOne(() => UserEntity, {
        eager: true,
    })
    @JoinColumn({ name: 'user_id' })
    user!: UserEntity

    @Column()
    hash!: string

    @Column()
    is_valid!: boolean

    @CreateDateColumn()
    created_at!: Date | string

    @UpdateDateColumn()
    updated_at!: Date | string
}
