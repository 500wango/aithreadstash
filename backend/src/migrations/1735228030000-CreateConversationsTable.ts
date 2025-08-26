import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateConversationsTable1735228030000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'conversations',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'title',
            type: 'varchar',
          },
          {
            name: 'summary',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'messages',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'tokenCount',
            type: 'integer',
            default: 0,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'archived', 'deleted'],
            default: "'active'",
          },
          {
            name: 'model',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'tags',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'userId',
            type: 'integer',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: "now()",
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: "now()",
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'conversations',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('conversations');
  }
}