import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import Stripe from 'stripe';

import { StripeService } from './stripe.service';
import { User } from '../database/user.entity';

// Mock Stripe
const mockStripe = {
  customers: {
    create: jest.fn(),
    retrieve: jest.fn(),
  },
  subscriptions: {
    retrieve: jest.fn(),
    list: jest.fn(),
  },
  checkout: {
    sessions: {
      create: jest.fn(),
    },
  },
  billingPortal: {
    sessions: {
      create: jest.fn(),
    },
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
  prices: {
    retrieve: jest.fn(),
  },
};

// Mock the default export for ES modules
jest.mock('stripe', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => mockStripe),
}));

describe('StripeService', () => {
  let service: StripeService;
  let userRepository: Repository<User>;

  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleLogSpy?.mockRestore();
    consoleWarnSpy?.mockRestore();
    consoleErrorSpy?.mockRestore();
  });

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword',
    subscriptionStatus: 'free',
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    conversations: [],
  } as User;

  const mockUserWithCustomer: User = {
    ...mockUser,
    stripeCustomerId: 'cus_test123',
  };

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Ensure real-flow (disable DEV_FAKE fallback in service)
    process.env.STRIPE_SECRET_KEY = 'sk_test_unit';
    delete process.env.STRIPE_DEV_FAKE;

    // Set up default mocks
    mockStripe.customers.retrieve.mockResolvedValue({
      id: 'cus_test123',
      metadata: { userId: '1' },
      deleted: false,
    });
    
    mockStripe.subscriptions.retrieve.mockResolvedValue({
      id: 'sub_test123',
      status: 'active',
      metadata: { userId: '1' },
    });

    // New mocks used by service implementation
    mockStripe.prices.retrieve.mockResolvedValue({
      id: 'price_test123',
      active: true,
      currency: 'usd',
      livemode: false,
      product: 'prod_test123',
    } as any);

    mockStripe.subscriptions.list.mockResolvedValue({ data: [] } as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StripeService>(StripeService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  describe('createCheckoutSession', () => {
    it('应该成功创建结账会话（新客户）', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      mockStripe.customers.create.mockResolvedValue({ id: 'cus_new123' });
      mockStripe.checkout.sessions.create.mockResolvedValue({ url: 'https://checkout.stripe.com/test_session' });
      jest.spyOn(userRepository, 'update').mockResolvedValue({} as any);

      const result = await service.createCheckoutSession(
        1,
        'price_test123',
        'http://success.com',
        'http://cancel.com'
      );

      expect(result).toBe('https://checkout.stripe.com/test_session');
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        metadata: { userId: '1' },
      });
      expect(userRepository.update).toHaveBeenCalledWith(1, { stripeCustomerId: 'cus_new123' });
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_new123',
          line_items: [{ price: 'price_test123', quantity: 1 }],
          mode: 'subscription',
          success_url: 'http://success.com',
          cancel_url: 'http://cancel.com',
          client_reference_id: '1',
          subscription_data: { metadata: { userId: '1' } },
        })
      );
    });

    it('应该成功创建结账会话（现有客户）', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUserWithCustomer);
      mockStripe.checkout.sessions.create.mockResolvedValue({ url: 'https://checkout.stripe.com/test_session' });

      const result = await service.createCheckoutSession(
        1,
        'price_test123',
        'http://success.com',
        'http://cancel.com'
      );

      expect(result).toBe('https://checkout.stripe.com/test_session');
      expect(mockStripe.customers.create).not.toHaveBeenCalled();
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_test123',
          line_items: [{ price: 'price_test123', quantity: 1 }],
          mode: 'subscription',
          success_url: 'http://success.com',
          cancel_url: 'http://cancel.com',
          client_reference_id: '1',
          subscription_data: { metadata: { userId: '1' } },
        })
      );
    });

    it('用户不存在时应该抛出异常', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.createCheckoutSession(999, 'price_test123', 'http://success.com', 'http://cancel.com')
      ).rejects.toThrow(BadRequestException);
    });

    it('Stripe错误时应该抛出异常', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      mockStripe.customers.create.mockResolvedValue({ id: 'cus_new123' });
      mockStripe.checkout.sessions.create.mockRejectedValue(new Error('Stripe error'));

      await expect(
        service.createCheckoutSession(1, 'price_test123', 'http://success.com', 'http://cancel.com')
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('createCustomerPortalSession', () => {
    it('应该成功创建客户门户会话', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUserWithCustomer);
      mockStripe.billingPortal.sessions.create.mockResolvedValue({ url: 'https://billing.stripe.com/test_portal' });

      const result = await service.createCustomerPortalSession(1, 'http://return.com');

      expect(result).toBe('https://billing.stripe.com/test_portal');
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_test123',
        return_url: 'http://return.com',
      });
    });

    it('用户不存在时应该抛出异常', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.createCustomerPortalSession(999, 'http://return.com')
      ).rejects.toThrow(BadRequestException);
    });

    it('用户没有Stripe客户ID时应该抛出异常', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      await expect(
        service.createCustomerPortalSession(1, 'http://return.com')
      ).rejects.toThrow(BadRequestException);
    });

    it('Stripe错误时应该抛出异常', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUserWithCustomer);
      mockStripe.billingPortal.sessions.create.mockRejectedValue(new Error('Stripe error'));

      await expect(
        service.createCustomerPortalSession(1, 'http://return.com')
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('handleWebhookEvent', () => {
    const mockPayload = Buffer.from('test payload');
    const mockSignature = 'test_signature';

    beforeEach(() => {
      process.env.STRIPE_WEBHOOK_SECRET = 'test_secret';
    });

    it('应该成功处理webhook事件', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: { object: { client_reference_id: '1', customer: 'cus_test123', subscription: 'sub_test123' } },
      });
      jest.spyOn(userRepository, 'update').mockResolvedValue({} as any);

      const result = await service.handleWebhookEvent(mockPayload, mockSignature);

      expect(result).toEqual({ received: true });
      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        mockPayload,
        mockSignature,
        'test_secret'
      );
      expect(userRepository.update).toHaveBeenCalledWith(1, {
        stripeCustomerId: 'cus_test123',
        stripeSubscriptionId: 'sub_test123',
        subscriptionStatus: 'pro',
      });
    });

    it('webhook密钥未配置时应该抛出异常', async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET;

      await expect(
        service.handleWebhookEvent(mockPayload, mockSignature)
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('签名验证失败时应该抛出异常', async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Signature verification failed');
      });

      await expect(
        service.handleWebhookEvent(mockPayload, mockSignature)
      ).rejects.toThrow(BadRequestException);
    });

    it('应该处理未支持的事件类型', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        type: 'unknown.event',
        data: { object: {} },
      });

      const result = await service.handleWebhookEvent(mockPayload, mockSignature);

      expect(result).toEqual({ received: true });
    });
  });
});