import { MigrationInterface, QueryRunner } from 'typeorm'
import { RoleName } from '../modules/role/enums/RoleName'

export class CreateTablesRoleAndUserRoles1708813912753 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE roles (
                id UUID NOT NULL PRIMARY KEY UNIQUE DEFAULT gen_random_uuid(),
                name VARCHAR(100) UNIQUE NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
       `)
        await queryRunner.query(`
            CREATE TABLE user_roles (
                id UUID NOT NULL PRIMARY KEY UNIQUE DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES "users" (id),
                role_id UUID NOT NULL REFERENCES "roles" (id),
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, role_id)
            );
       `)

        // Insert roles

        await queryRunner.query(
            `INSERT INTO roles (
                name
            ) VALUES(
                '${RoleName.ADMIN}'
            )`,
        )

        await queryRunner.query(
            `INSERT INTO roles (
                name
            ) VALUES(
                '${RoleName.EDITOR}'
            )`,
        )

        await queryRunner.query(
            `INSERT INTO roles (
                name
            ) VALUES(
                '${RoleName.VIEWER}'
            )`,
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE user_roles`)
        await queryRunner.query(`DROP TABLE roles`)
    }
}
