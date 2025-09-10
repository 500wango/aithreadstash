import { Controller, Post, Body, UseGuards, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../database/user.entity';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('create-checkout-session')
  @UseGuards(JwtAuthGuard)
  async createCheckoutSession(
    @GetUser() user: User,
    @Body() body: { priceId: string; successUrl: string; cancelUrl: string }
  ) {
    const sessionUrl = await this.stripeService.createCheckoutSession(
      user.id,
      body.priceId,
      body.successUrl,
      body.cancelUrl
    );
    
    return { url: sessionUrl };
  }

  @Post('create-portal-session')
  @UseGuards(JwtAuthGuard)
  async createPortalSession(
    @GetUser() user: User,
    @Body() body: { returnUrl: string }
  ) {
    const sessionUrl = await this.stripeService.createCustomerPortalSession(
      user.id,
      body.returnUrl
    );
    
    return { url: sessionUrl };
  }

  @Post('sync-subscription')
  @UseGuards(JwtAuthGuard)
  async syncSubscription(@GetUser() user: User) {
    const updated = await this.stripeService.syncSubscriptionForUser(user.id);
    return { user: updated };
  }

  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string
  ) {
    if (!req.rawBody) {
      throw new Error('Raw body is required for webhook verification');
    }

    return await this.stripeService.handleWebhookEvent(req.rawBody, signature);
  }
}