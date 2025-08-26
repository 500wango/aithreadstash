const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');

async function test() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3001);
  console.log('Test server running on port 3001');
}

test().catch(console.error);