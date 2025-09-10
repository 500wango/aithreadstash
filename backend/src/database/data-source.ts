import { DataSource } from 'typeorm';
import { User } from './user.entity';
import { Conversation } from './conversation.entity';
import 'dotenv/config';
import * as fs from 'fs';

const useExplicit = !!(process.env.DB_HOST || process.env.DB_USERNAME || process.env.DB_PASSWORD || process.env.DB_NAME);
const useUrl = !useExplicit && !!process.env.DATABASE_URL;

const nodeEnv = String(process.env.NODE_ENV || 'development');
const sslMode = String(process.env.DB_SSL_MODE || (nodeEnv === 'production' ? 'require' : 'disable'));
const sslCaPath = process.env.DB_SSL_CA_PATH;
const sslCa = process.env.DB_SSL_CA;
const managedProviderUrl = !!process.env.DATABASE_URL && /neon\.tech|supabase\.co|aws\.com/i.test(String(process.env.DATABASE_URL));

let ssl: any = undefined;
if (sslMode === 'disable') {
  ssl = undefined;
} else if (sslMode === 'require') {
  ssl = { rejectUnauthorized: false };
} else if (sslMode === 'verify-ca' || sslMode === 'verify-full') {
  const caContent = sslCaPath && fs.existsSync(sslCaPath) ? fs.readFileSync(sslCaPath, 'utf8') : sslCa;
  if (!caContent) {
    ssl = { rejectUnauthorized: false };
  } else {
    ssl = { rejectUnauthorized: true, ca: caContent } as any;
  }
} else if (managedProviderUrl) {
  ssl = { rejectUnauthorized: false };
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  ...(useUrl
    ? { url: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: +(process.env.DB_PORT || 5432),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'aithreadstash',
      }),
  entities: [User, Conversation],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: process.env.TYPEORM_LOGGING === 'true' || process.env.NODE_ENV !== 'production',
  ...(ssl ? { ssl, extra: { ssl } } : {}),
});