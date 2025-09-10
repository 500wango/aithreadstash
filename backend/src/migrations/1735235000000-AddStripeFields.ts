import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddStripeFields1735235000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('users', [
      new TableColumn({
        name: 'stripeCustomerId',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'stripeSubscriptionId',
        type: 'varchar',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('users', [
      'stripeCustomerId',
      'stripeSubscriptionId',
    ]);
  }
}