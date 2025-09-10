import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/user.entity';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    // In dev, if STRIPE_SECRET_KEY is not provided, use a harmless dummy key to avoid constructor throw.
    // All runtime calls are short-circuited by dev fallbacks before hitting the API when no real key is set.
    const apiKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy';
    this.stripe = new Stripe(apiKey);
  }

  async createCheckoutSession(userId: number, priceId: string, successUrl: string, cancelUrl: string): Promise<string> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // 开发环境回退：当未配置 Stripe 密钥或使用占位 priceId 时，直接模拟成功并将用户升级为 Pro
    const isDev = process.env.NODE_ENV !== 'production';
    const isPlaceholderPrice = priceId === 'price_monthly_test_id' || priceId === 'price_yearly_test_id';
    if (isDev && (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_DEV_FAKE === '1' || isPlaceholderPrice)) {
      this.logger.warn('[DEV FAKE] Bypassing real checkout. Upgrading user locally.', {
        userId,
        priceId,
        NODE_ENV: process.env.NODE_ENV,
      });
      await this.userRepository.update(userId, {
        subscriptionStatus: 'pro',
        stripeCustomerId: user.stripeCustomerId || `cus_dev_${userId}`,
        stripeSubscriptionId: `sub_dev_${Date.now()}`,
      });
      return successUrl;
    }

    let customerId = user.stripeCustomerId;
    
    // 如果已有 customerId，先用当前密钥检索；若检索失败（如资源在另一模式或不存在），则创建当前模式的新客户
    if (customerId) {
      try {
        const existing = await this.stripe.customers.retrieve(customerId);
        if (existing && typeof existing === 'object' && (existing as any).deleted) {
          customerId = undefined as any;
        }
      } catch (e: any) {
        this.logger.warn('Existing customerId not accessible in current key/mode, will create new', {
          customerId,
          message: e?.message,
          type: e?.type,
          code: e?.code,
          statusCode: e?.statusCode,
          requestId: e?.requestId,
        });
        customerId = undefined as any;
      }
    }

    // 仅用于记录价格信息，便于排障（失败时不会阻断流程）
    try {
      const price = await this.stripe.prices.retrieve(priceId);
      this.logger.log('Price lookup', {
        priceId,
        active: price?.active,
        currency: price?.currency,
        nickname: (price as any)?.nickname,
        product: typeof price.product === 'string' ? price.product : (price.product as any)?.id,
        livemode: price?.livemode,
      });
    } catch (e: any) {
      this.logger.warn('Failed to retrieve price', {
        priceId,
        message: e?.message,
        type: e?.type,
        code: e?.code,
        statusCode: e?.statusCode,
        requestId: e?.requestId,
      });
    }

    try {
      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: userId.toString(),
        subscription_data: {
          metadata: { userId: userId.toString() },
        },
        allow_promotion_codes: true,
      });

      return session.url;
    } catch (error: any) {
      this.logger.error('Stripe checkout session error', {
        message: error?.message,
        type: error?.type,
        code: error?.code,
        statusCode: error?.statusCode,
        param: error?.param,
        rawType: error?.rawType,
        rawMessage: error?.raw?.message,
        requestId: error?.requestId,
        docs: error?.docs_url,
      });
      throw new InternalServerErrorException('Failed to create checkout session');
    }
  }

  async createCustomerPortalSession(userId: number, returnUrl: string): Promise<string> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user || !user.stripeCustomerId) {
      // 开发环境回退：允许直接回跳
      const isDev = process.env.NODE_ENV !== 'production';
      if (isDev && !process.env.STRIPE_SECRET_KEY) {
        this.logger.warn('[DEV FAKE] No stripeCustomerId. Returning returnUrl in dev.', { userId });
        return returnUrl;
      }
      throw new BadRequestException('No active subscription found');
    }

    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: returnUrl,
      });

      return session.url;
    } catch (error) {
      // 开发环境回退：避免卡死在门户
      const isDev = process.env.NODE_ENV !== 'production';
      if (isDev && !process.env.STRIPE_SECRET_KEY) {
        this.logger.warn('[DEV FAKE] Failed to create portal session, returning returnUrl in dev.', { userId });
        return returnUrl;
      }
      throw new InternalServerErrorException('Failed to create customer portal session');
    }
  }

  // 新增：根据 Stripe 实时数据同步用户订阅状态（用于 webhook 兜底/手动刷新）
  async syncSubscriptionForUser(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // 若没有绑定 Stripe 客户，直接视为 free（开发环境假订阅除外）
    if (!user.stripeCustomerId) {
      const isDev = process.env.NODE_ENV !== 'production';
      if (isDev && !process.env.STRIPE_SECRET_KEY && user.subscriptionStatus === 'pro') {
        // 在开发假订阅场景下，保持 Pro 状态
        return user;
      }
      if (user.subscriptionStatus !== 'free') {
        await this.userRepository.update(userId, { subscriptionStatus: 'free' });
        user.subscriptionStatus = 'free';
      }
      return user;
    }

    try {
      // 优先查找活跃订阅
      const activeSubs = await this.stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'active',
        limit: 1,
      });

      if (activeSubs.data.length > 0) {
        const sub = activeSubs.data[0];
        await this.userRepository.update(userId, {
          subscriptionStatus: 'pro',
          stripeSubscriptionId: sub.id,
        });
        return { ...user, subscriptionStatus: 'pro', stripeSubscriptionId: sub.id } as User;
      }

      // 未找到 active，则取最近一条订阅记录做兜底判断
      const anySubs = await this.stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'all',
        limit: 1,
      });

      if (anySubs.data.length > 0) {
        const sub = anySubs.data[0];
        if (sub.status === 'active') {
          await this.userRepository.update(userId, {
            subscriptionStatus: 'pro',
            stripeSubscriptionId: sub.id,
          });
          return { ...user, subscriptionStatus: 'pro', stripeSubscriptionId: sub.id } as User;
        }
      }

      // 其余情况均降级为 free
      if (user.subscriptionStatus !== 'free') {
        await this.userRepository.update(userId, { subscriptionStatus: 'free' });
      }
      return { ...user, subscriptionStatus: 'free' } as User;
    } catch (error) {
      this.logger.error('syncSubscriptionForUser failed', error as any);
      // 出错时不改变现有状态，返回当前用户数据
      return user;
    }
  }

  async handleWebhookEvent(payload: Buffer, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      throw new InternalServerErrorException('Webhook secret not configured');
    }

    let event: Stripe.Event;
    
    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      throw new BadRequestException('Webhook signature verification failed');
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const userId = session.client_reference_id;
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;

    if (!userId) {
      this.logger.error('No user ID found in session');
      return;
    }

    try {
      // 获取订阅详情以确认状态
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      
      if (subscription.status === 'active') {
        await this.userRepository.update(parseInt(userId), {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          subscriptionStatus: 'pro',
          onTrial: false,
          trialEndsAt: null,
        });
        this.logger.log(`User ${userId} subscription activated successfully`);
      } else {
        this.logger.warn(`Subscription ${subscriptionId} is not active: ${subscription.status}`);
      }
    } catch (error) {
      this.logger.error('Error handling checkout.session.completed event:', error as any);
    }
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    try {
      const customer = await this.stripe.customers.retrieve(subscription.customer as string);
      const customerObj = customer as Stripe.Customer;
      const userId = customerObj.metadata?.userId;
      if (userId) {
        const active = subscription.status === 'active';
        await this.userRepository.update(parseInt(userId), {
          subscriptionStatus: active ? 'pro' : 'free',
          stripeSubscriptionId: subscription.id,
          ...(active ? { onTrial: false, trialEndsAt: null } : {}),
        });
      }
    } catch (error) {
      this.logger.error('Error handling customer.subscription.updated event:', error as any);
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    try {
      const customer = await this.stripe.customers.retrieve(subscription.customer as string);
      const customerObj = customer as Stripe.Customer;
      const userId = customerObj.metadata?.userId;
      if (userId) {
        await this.userRepository.update(parseInt(userId), {
          subscriptionStatus: 'free',
          stripeSubscriptionId: null,
          onTrial: false,
          trialEndsAt: null,
        });
      }
    } catch (error) {
      this.logger.error('Error handling customer.subscription.deleted event:', error as any);
    }
  }
}