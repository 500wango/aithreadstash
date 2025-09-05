import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as jwt from 'jsonwebtoken';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../database/user.entity';

// 覆盖“用户不存在”的 e2e 测试：携带合法签名但 sub 指向不存在用户的 JWT，应返回 401
describe('Auth (e2e)', () => {
  let app: INestApplication;

  const JWT_SECRET = 'dev-jwt-secret-key-change-in-production';

  beforeAll(async () => {
    // 确保 JwtStrategy 和我们签发的 token 使用同一密钥
    process.env.JWT_SECRET = JWT_SECRET;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /auth/me 无 token 应返回 401', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('GET /auth/me 携带不存在用户的 JWT 应返回 401', async () => {
    // 签发一个指向不存在用户的 token（确保 id 不存在）
    const token = jwt.sign({ sub: 999999, email: 'nouser@example.com' }, JWT_SECRET, { expiresIn: '5m' });

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });

  it('POST /auth/refresh 无 token 应返回 401', async () => {
    await request(app.getHttpServer()).post('/auth/refresh').expect(401);
  });

  it('POST /auth/refresh 携带有效 accessToken 应成功返回新 token', async () => {
    const email = `e2e-refresh-${Date.now()}@example.com`;
    const password = 'password123';

    // 1) 注册
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password })
      .expect(201);

    expect(registerRes.body).toHaveProperty('accessToken');

    const accessToken = registerRes.body.accessToken as string;

    // 2) 使用 accessToken 调用 refresh
    const refreshRes = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(refreshRes.body).toHaveProperty('accessToken');
    expect(refreshRes.body).toHaveProperty('refreshToken');
    expect(typeof refreshRes.body.accessToken).toBe('string');
    expect(typeof refreshRes.body.refreshToken).toBe('string');
  });
});