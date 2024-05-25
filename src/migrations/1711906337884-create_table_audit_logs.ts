import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateTableAuditLogs1711906337884 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE audit_logs (
              id UUID NOT NULL PRIMARY KEY UNIQUE DEFAULT gen_random_uuid(),
              action VARCHAR(255) NOT NULL,
              status_code SMALLINT NOT NULL,
              ip VARCHAR(255) NOT NULL,
              user_id UUID REFERENCES users (id),
              error TEXT,
              parameters JSONB,
              created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE audit_logs`)
    }
}
