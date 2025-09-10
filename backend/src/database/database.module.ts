import { Module } from '@nestjs/common';
import { TypeOrmModule, type TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './user.entity';
import { Conversation } from './conversation.entity';
import * as fs from 'fs';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService): Promise<TypeOrmModuleOptions> => {
        const hasDbFields =
          !!(config.get('DB_HOST') || config.get('DB_USERNAME') || config.get('DB_PASSWORD') || config.get('DB_NAME'));
        const databaseUrl = config.get<string>('DATABASE_URL');
        const logging = config.get('TYPEORM_LOGGING') === 'true' || config.get('NODE_ENV') !== 'production';
        const nodeEnv = String(config.get('NODE_ENV') || 'development');

        // SSL mode: disable | require | verify-ca | verify-full
        const sslMode = String(config.get('DB_SSL_MODE') || (nodeEnv === 'production' ? 'require' : 'disable'));
        const sslCaPath = config.get<string>('DB_SSL_CA_PATH');
        const sslCa = config.get<string>('DB_SSL_CA');

        // Heuristic for common managed providers when using DATABASE_URL only
        const managedProviderUrl = !!databaseUrl && /neon\.tech|supabase\.co|aws\.com/i.test(String(databaseUrl));

        let ssl: any = undefined;
        if (sslMode === 'disable') {
          ssl = undefined;
        } else if (sslMode === 'require') {
          // require TLS but do not verify CA (some managed providers use shared CA)
          ssl = { rejectUnauthorized: false };
        } else if (sslMode === 'verify-ca' || sslMode === 'verify-full') {
          const caContent = sslCaPath && fs.existsSync(sslCaPath) ? fs.readFileSync(sslCaPath, 'utf8') : sslCa;
          if (!caContent) {
            // fallback to require if CA missing to avoid hard outage; can tighten later
            ssl = { rejectUnauthorized: false };
          } else {
            ssl = { rejectUnauthorized: true, ca: caContent } as any;
          }
        } else if (managedProviderUrl) {
          ssl = { rejectUnauthorized: false };
        }

        const options: TypeOrmModuleOptions = {
          type: 'postgres',
          ...(!hasDbFields && databaseUrl
            ? { url: String(databaseUrl) }
            : {
                host: String(config.get('DB_HOST') || 'localhost'),
                port: parseInt(String(config.get('DB_PORT') || '5432'), 10),
                username: String(config.get('DB_USERNAME') || 'postgres'),
                password: String(config.get('DB_PASSWORD') ?? ''),
                database: String(config.get('DB_NAME') || 'aithreadstash'),
              }),
          entities: [User, Conversation],
          synchronize: false,
          logging,
          ...(ssl ? { ssl, extra: { ssl } } : {}),
        };
        return options;
      },
    }),
    TypeOrmModule.forFeature([User, Conversation]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}