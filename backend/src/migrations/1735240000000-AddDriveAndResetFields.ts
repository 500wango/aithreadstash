import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDriveAndResetFields1735240000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('users', [
      // Google Drive
      new TableColumn({ name: 'driveAccessToken', type: 'varchar', isNullable: true }),
      new TableColumn({ name: 'driveRefreshToken', type: 'varchar', isNullable: true }),
      new TableColumn({ name: 'driveTokenExpiry', type: 'timestamptz', isNullable: true }),
      new TableColumn({ name: 'driveFolderId', type: 'varchar', isNullable: true }),
      new TableColumn({ name: 'driveFolderName', type: 'varchar', isNullable: true }),

      // Reset password
      new TableColumn({ name: 'resetPasswordTokenHash', type: 'varchar', isNullable: true }),
      new TableColumn({ name: 'resetPasswordExpiresAt', type: 'timestamptz', isNullable: true }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('users', [
      'driveAccessToken',
      'driveRefreshToken',
      'driveTokenExpiry',
      'driveFolderId',
      'driveFolderName',
      'resetPasswordTokenHash',
      'resetPasswordExpiresAt',
    ]);
  }
}