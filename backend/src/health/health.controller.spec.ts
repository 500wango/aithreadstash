import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HealthController } from './health.controller';
import { User } from '../database/user.entity';

describe('HealthController', () => {
  let controller: HealthController;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const mockRepository = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('应该被定义', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('数据库连接正常时应该返回健康状态', async () => {
      jest.spyOn(userRepository, 'query').mockResolvedValue([{ '?column?': 1 }]);
      
      const originalEnv = process.env.NODE_ENV;
      const originalVersion = process.env.npm_package_version;
      process.env.NODE_ENV = 'test';
      process.env.npm_package_version = '1.2.3';

      const result = await controller.check();

      expect(result.status).toBe('ok');
      expect(result.database).toBe('connected');
      expect(result.environment).toBe('test');
      expect(result.version).toBe('1.2.3');
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeDefined();
      expect(userRepository.query).toHaveBeenCalledWith('SELECT 1');

      // 恢复环境变量
      process.env.NODE_ENV = originalEnv;
      process.env.npm_package_version = originalVersion;
    });

    it('数据库连接失败时应该返回错误状态', async () => {
      const dbError = new Error('Database connection failed');
      jest.spyOn(userRepository, 'query').mockRejectedValue(dbError);

      const result = await controller.check();

      expect(result.status).toBe('error');
      expect(result.database).toBe('disconnected');
      expect(result.error).toBe('Database connection failed');
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeDefined();
      expect(userRepository.query).toHaveBeenCalledWith('SELECT 1');
    });

    it('环境变量未设置时应该使用默认值', async () => {
      jest.spyOn(userRepository, 'query').mockResolvedValue([{ '?column?': 1 }]);
      
      const originalEnv = process.env.NODE_ENV;
      const originalVersion = process.env.npm_package_version;
      delete process.env.NODE_ENV;
      delete process.env.npm_package_version;

      const result = await controller.check();

      expect(result.status).toBe('ok');
      expect(result.environment).toBe('development');
      expect(result.version).toBe('1.0.0');

      // 恢复环境变量
      process.env.NODE_ENV = originalEnv;
      process.env.npm_package_version = originalVersion;
    });
  });
});