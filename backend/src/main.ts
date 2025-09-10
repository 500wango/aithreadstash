// Fallback: define global crypto for environments lacking globalThis.crypto (older Node.js)
import * as nodeCrypto from 'crypto';
if (!(global as any).crypto) {
  (global as any).crypto = nodeCrypto as any;
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
  
  // Configure CORS based on environment
  const isProd = configService.get<string>('NODE_ENV') === 'production';
  const frontendUrl = configService.get<string>('FRONTEND_URL');
  const frontendUrlDev = frontendUrl || 'http://localhost:3000';


  // 收敛生产环境的扩展来源为指定 ID；开发环境下保留通配，便于本地调试
  const extensionId = configService.get<string>('CHROME_EXTENSION_ID');
  const extensionOriginProd = extensionId ? `chrome-extension://${extensionId}` : null;

  // 在开发环境下同时允许 3000 与 3001，避免不同端口导致的跨域失败
  const corsOrigins = isProd 
    ? [
        frontendUrl,
        'https://aithreadstash.com',

        ...(extensionOriginProd ? [extensionOriginProd] : []),
      ]
    : [
        frontendUrlDev,
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3035',
        'http://localhost:3037',
        'chrome-extension://*',
      ];

  // Trust proxy for correct protocol/secure cookies when behind reverse proxy
  // @ts-ignore - express settings available under platform-express
  app.set('trust proxy', 1);

  // Security headers via helmet (CSP kept conservative to avoid breaking existing frontends)
  app.use(
    helmet({
      contentSecurityPolicy: isProd
        ? {
            useDefaults: true,
            directives: {
              defaultSrc: ["'self'"],
              connectSrc: ["'self'", frontendUrl || "'self'"],
              imgSrc: ["'self'", 'data:'],
              styleSrc: ["'self'", "'unsafe-inline'"],
              scriptSrc: ["'self'"],
              frameAncestors: ["'none'"],
            },
          }
        : false, // keep dev flexible
      referrerPolicy: { policy: 'no-referrer' },
      crossOriginOpenerPolicy: { policy: 'same-origin' },
    })
  );

  // Enforce HTTPS in production (preferably handled at proxy; here as a safety net)
  if (isProd) {
    app.use((req: any, res: any, next: any) => {
      // Skip redirect for health checks and Stripe webhook (internal probes & raw body)
      const url = req.originalUrl || req.url || '';
      if (url.startsWith('/health') || url.startsWith('/stripe/webhook')) {
        return next();
      }
      const xfProto = req.headers['x-forwarded-proto'];
      const isHttps = req.secure || xfProto === 'https';
      if (!isHttps) {
        const host = req.headers.host;
        return res.redirect(301, `https://${host}${req.originalUrl}`);
      }
      return next();
    });
  }

  // Enable HTTP compression
  app.use(compression());
    
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  app.use('/stripe/webhook', bodyParser.raw({ type: 'application/json' }));
  
  const port = Number(process.env.PORT || configService.get<number>('PORT') || 3007);
  await app.listen(port, '0.0.0.0');
  logger.log(`Server running on port ${port}`);
  logger.log(`Environment: ${configService.get<string>('NODE_ENV') || 'development'}`);
  logger.log(`CORS origins: ${corsOrigins.join(', ')}`);
  if (isProd && !extensionOriginProd) {
    logger.warn('CHROME_EXTENSION_ID is not set; Chrome extension will not be allowed by CORS in production.');
  }
}
bootstrap();