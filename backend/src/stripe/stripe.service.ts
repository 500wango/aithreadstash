import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/user.entity';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-07-30.basil',
    });
  }

  async createCheckoutSession(userId: number, priceId: string, successUrl: string, cancelUrl: string): Promise<string> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new BadRequestException('User not found');
    }

    let customerId = user.stripeCustomerId;
    
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        metadata: {
          userId: userId.toString(),
        },
      });
      
      customerId = customer.id;
      await this.userRepository.update(userId, { stripeCustomerId: customerId });
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
          metadata: {
            userId: userId.toString(),
          },
        },
      });

      return session.url;
    } catch (error) {
      throw new InternalServerErrorException('Failed to create checkout session');
    }
  }

  async createCustomerPortalSession(userId: number, returnUrl: string): Promise<string> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user || !user.stripeCustomerId) {
      throw new BadRequestException('No active subscription found');
    }

    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: returnUrl,
      });

      return session.url;
    } catch (error) {
      console.error('Stripe portal session error:', error);
      throw new InternalServerErrorException('Failed to create portal session');
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
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const userId = session.client_reference_id;
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;

    if (!userId) {
      console.error('No user ID found in session');
      return;
    }

    try {
      await this.userRepository.update(parseInt(userId), {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        subscriptionStatus: 'pro',
      });
    } catch (error) {
      console.error('Failed to update user subscription:', error);
    }
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const userId = subscription.metadata.userId;
    
    if (!userId) {
      console.error('No user ID found in subscription metadata');
      return;
    }

    try {
      if (subscription.status === 'active') {
        await this.userRepository.update(parseInt(userId), {
          subscriptionStatus: 'pro',
          stripeSubscriptionId: subscription.id,
        });
      } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
        await this.userRepository.update(parseInt(userId), {
          subscriptionStatus: 'free',
        });
      }
    } catch (error) {
      console.error('Failed to update subscription status:', error);
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const userId = subscription.metadata.userId;
    
    if (!userId) {
      console.error('No user ID found in subscription metadata');
      return;
    }

    try {
      await this.userRepository.update(parseInt(userId), {
        subscriptionStatus: 'free',
        stripeSubscriptionId: null,
      });
    } catch (error) {
      console.error('Failed to handle subscription deletion:', error);
    }
  }
}