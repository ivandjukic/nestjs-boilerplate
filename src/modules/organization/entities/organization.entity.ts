import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity({ name: 'organizations' })
export class OrganizationEntity {
    @PrimaryGeneratedColumn({})
    id: string

    @Column({})
    name: string

    @CreateDateColumn({})
    created_at: string

    @UpdateDateColumn({})
    updated_at: string

    @DeleteDateColumn({})
    deleted_at?: string
}
