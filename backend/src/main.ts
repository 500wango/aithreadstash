import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
  
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3003', 'http://localhost:3005', 'http://localhost:3006', 'chrome-extension://*'],
    credentials: true,
  });
  
  app.use('/stripe/webhook', bodyParser.raw({ type: 'application/json' }));
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Server running on port ${port}`);
}
bootstrap();