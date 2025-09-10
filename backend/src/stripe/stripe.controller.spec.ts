import { Test, TestingModule } from '@nestjs/testing';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../database/user.entity';

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

describe('StripeController', () => {
  let controller: StripeController;
  let stripeService: StripeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StripeController],
      providers: [
        {
          provide: StripeService,
          useValue: {
            createCheckoutSession: jest.fn(),
            createCustomerPortalSession: jest.fn(),
            handleWebhookEvent: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<StripeController>(StripeController);
    stripeService = module.get<StripeService>(StripeService);
  });

  it('应该被定义', () => {
    expect(controller).toBeDefined();
  });

  describe('createCheckoutSession', () => {
    it('应该成功创建结账会话', async () => {
      const body = {
        priceId: 'price_test123',
        successUrl: 'http://success.com',
        cancelUrl: 'http://cancel.com',
      };

      const sessionUrl = 'https://checkout.stripe.com/test_session';
      jest.spyOn(stripeService, 'createCheckoutSession').mockResolvedValue(sessionUrl);

      const result = await controller.createCheckoutSession(mockUser, body);

      expect(result).toEqual({ url: sessionUrl });
      expect(stripeService.createCheckoutSession).toHaveBeenCalledWith(
        mockUser.id,
        body.priceId,
        body.successUrl,
        body.cancelUrl
      );
    });
  });

  describe('createPortalSession', () => {
    it('应该成功创建客户门户会话', async () => {
      const body = {
        returnUrl: 'http://return.com',
      };

      const sessionUrl = 'https://billing.stripe.com/test_portal';
      jest.spyOn(stripeService, 'createCustomerPortalSession').mockResolvedValue(sessionUrl);

      const result = await controller.createPortalSession(mockUser, body);

      expect(result).toEqual({ url: sessionUrl });
      expect(stripeService.createCustomerPortalSession).toHaveBeenCalledWith(
        mockUser.id,
        body.returnUrl
      );
    });
  });

  describe('handleWebhook', () => {
    it('应该成功处理webhook事件', async () => {
      const mockReq = {
        rawBody: Buffer.from('test payload'),
      } as any;

      const signature = 'test_signature';
      const webhookResult = { received: true };
      jest.spyOn(stripeService, 'handleWebhookEvent').mockResolvedValue(webhookResult);

      const result = await controller.handleWebhook(mockReq, signature);

      expect(result).toEqual(webhookResult);
      expect(stripeService.handleWebhookEvent).toHaveBeenCalledWith(
        mockReq.rawBody,
        signature
      );
    });

    it('缺少raw body时应该抛出错误', async () => {
      const mockReq = {
        rawBody: null,
      } as any;

      const signature = 'test_signature';

      await expect(controller.handleWebhook(mockReq, signature)).rejects.toThrow(
        'Raw body is required for webhook verification'
      );
    });
  });
});