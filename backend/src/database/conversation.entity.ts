import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ type: 'jsonb', default: [] })
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
  }>;

  @Column({ default: 0 })
  tokenCount: number;

  @Column({ 
    type: 'enum', 
    enum: ['active', 'archived', 'deleted'], 
    default: 'active' 
  })
  status: 'active' | 'archived' | 'deleted';

  @Column({ nullable: true })
  model: string;

  @Column({ nullable: true })
  tags: string;

  @ManyToOne(() => User, user => user.conversations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}