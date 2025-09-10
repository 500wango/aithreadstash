import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddNotionFields1735230000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('users', [
      new TableColumn({
        name: 'notionAccessToken',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'notionWorkspaceId',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'notionWorkspaceName',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'notionDatabaseId',
        type: 'varchar',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('users', [
      'notionAccessToken',
      'notionWorkspaceId',
      'notionWorkspaceName',
      'notionDatabaseId',
    ]);
  }
}