import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUserRole1700000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('users', new TableColumn({
      name: 'role',
      type: 'enum',
      enum: ['user', 'admin'],
      default: "'user'",
      isNullable: false,
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'role');
  }
}