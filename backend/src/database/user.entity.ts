import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Conversation } from './conversation.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ 
    type: 'enum', 
    enum: ['free', 'pro'], 
    default: 'free' 
  })
  subscriptionStatus: 'free' | 'pro';

  @Column({ 
    type: 'enum', 
    enum: ['user', 'admin'], 
    default: 'user' 
  })
  role: 'user' | 'admin';

  @Column({ nullable: true })
  googleId: string;

  @Column({ nullable: true })
  githubId: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  notionAccessToken: string;

  @Column({ nullable: true })
  notionWorkspaceId: string;

  @Column({ nullable: true })
  notionWorkspaceName: string;

  @Column({ nullable: true })
  notionDatabaseId: string;

  // === Google Drive integration fields ===
  @Column({ nullable: true })
  driveAccessToken: string; // AES encrypted

  @Column({ nullable: true })
  driveRefreshToken: string; // AES encrypted

  @Column({ type: 'timestamptz', nullable: true })
  driveTokenExpiry: Date | null; // access token expiry

  @Column({ nullable: true })
  driveFolderId: string;

  @Column({ nullable: true })
  driveFolderName: string;

  @Column({ nullable: true })
  stripeCustomerId: string;

  @Column({ nullable: true })
  stripeSubscriptionId: string;

  // === Trial fields ===
  @Column({ type: 'boolean', default: false })
  onTrial: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  trialEndsAt: Date | null;

  // === Password reset fields ===
  @Column({ nullable: true })
  resetPasswordTokenHash: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  resetPasswordExpiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Conversation, conversation => conversation.user)
  conversations: Conversation[];
}