import { DataSource } from 'typeorm';
import { User } from './user.entity';
import { Conversation } from './conversation.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: '740135',
  database: 'aithreadstash',
  entities: [User, Conversation],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: true,
});