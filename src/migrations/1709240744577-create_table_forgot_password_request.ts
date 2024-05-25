import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateTableForgotPasswordRequest1709240744577 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
          CREATE TABLE IF NOT EXISTS forgot_password_requests (
            id UUID NOT NULL PRIMARY KEY UNIQUE DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES "users" (id),
            hash VARCHAR NOT NULL UNIQUE,
            is_valid BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE forgot_password_requests`)
    }
}
