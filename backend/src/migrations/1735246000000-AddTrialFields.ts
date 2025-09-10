import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTrialFields1735246000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasOnTrial = await queryRunner.hasColumn('users', 'onTrial');
    if (!hasOnTrial) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'onTrial',
          type: 'boolean',
          isNullable: false,
          default: false,
        }),
      );
    }

    const hasTrialEndsAt = await queryRunner.hasColumn('users', 'trialEndsAt');
    if (!hasTrialEndsAt) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'trialEndsAt',
          type: 'timestamptz',
          isNullable: true,
          default: null,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTrialEndsAt = await queryRunner.hasColumn('users', 'trialEndsAt');
    if (hasTrialEndsAt) {
      await queryRunner.dropColumn('users', 'trialEndsAt');
    }

    const hasOnTrial = await queryRunner.hasColumn('users', 'onTrial');
    if (hasOnTrial) {
      await queryRunner.dropColumn('users', 'onTrial');
    }
  }
}