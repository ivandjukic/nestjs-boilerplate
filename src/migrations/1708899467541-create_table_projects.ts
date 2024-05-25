import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateTableProjects1708899467541 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
        CREATE TABLE projects (
          id UUID NOT NULL PRIMARY KEY UNIQUE DEFAULT gen_random_uuid(),
          name VARCHAR(255),
          description TEXT,
          user_id UUID REFERENCES users (id),
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          deleted_at TIMESTAMP
        );
    `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE projects`)
    }
}
