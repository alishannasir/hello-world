import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import Stripe from 'stripe';
import { SubscriptionPlan } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '');

  constructor(private readonly prisma: PrismaService) {}

  private priceFor(plan: 'STANDARD' | 'PREMIUM' | 'MONTHLY' | 'ANNUAL'): string {
    const prices: Record<string, string | undefined> = {
      STANDARD: process.env.STRIPE_PRICE_STANDARD,
      PREMIUM: process.env.STRIPE_PRICE_PREMIUM,
      MONTHLY: process.env.STRIPE_PRICE_MONTHLY,
      ANNUAL: process.env.STRIPE_PRICE_ANNUAL,
    };
    return prices[plan] ?? '';
  }

  private planForPrice(priceId?: string): SubscriptionPlan {
    if (priceId && priceId === process.env.STRIPE_PRICE_STANDARD) return 'STANDARD';
    if (priceId && priceId === process.env.STRIPE_PRICE_PREMIUM) return 'PREMIUM';
    if (priceId && priceId === process.env.STRIPE_PRICE_ANNUAL) return 'ANNUAL';
    return 'MONTHLY';
  }

  async createCheckout(userId: string, plan: 'STANDARD' | 'PREMIUM' | 'MONTHLY' | 'ANNUAL') {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const frontend = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: this.priceFor(plan), quantity: 1 }],
      client_reference_id: userId,
      customer_email: user.email,
      allow_promotion_codes: true, // lets users redeem streak-reward promo codes
      success_url: `${frontend}/home?billing=success`,
      cancel_url: `${frontend}/upgrade?billing=cancelled`,
      metadata: { userId, plan },
    });
    return { url: session.url };
  }

  async createPortal(userId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { userId, stripeCustomerId: { not: null } },
      orderBy: { currentPeriodEnd: 'desc' },
    });
    if (!sub?.stripeCustomerId) throw new NotFoundException('No billing account yet');
    const frontend = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    const session = await this.stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${frontend}/home`,
    });
    return { url: session.url };
  }

  /**
   * Issues a streak-reward credit on the Stripe side. Existing billing
   * customers get an account balance credit (applied to the next invoice);
   * users without a Stripe customer get a one-time promotion code usable at
   * their next checkout. Returns a reference string, or null on failure -
   * the local creditCents balance is still granted either way.
   */
  async grantAccountCredit(userId: string, amountCents: number): Promise<string | null> {
    try {
      const sub = await this.prisma.subscription.findFirst({
        where: { userId, stripeCustomerId: { not: null } },
        orderBy: { currentPeriodEnd: 'desc' },
      });
      if (sub?.stripeCustomerId) {
        const txn = await this.stripe.customers.createBalanceTransaction(sub.stripeCustomerId, {
          amount: -amountCents, // negative amount credits the customer
          currency: 'usd',
          description: 'Streak reward credit',
        });
        return `balance_txn:${txn.id}`;
      }
      const coupon = await this.stripe.coupons.create({
        amount_off: amountCents,
        currency: 'usd',
        duration: 'once',
        name: 'Streak reward',
      });
      const promo = await this.stripe.promotionCodes.create({
        coupon: coupon.id,
        max_redemptions: 1,
        metadata: { userId },
      });
      return `promo:${promo.code}`;
    } catch (err) {
      this.logger.error(`Failed to issue Stripe credit for user ${userId}`, err as Error);
      return null;
    }
  }

  /** Webhooks are the source of truth for the subscriptions table. */
  async handleWebhook(rawBody: Buffer, signature: string) {
    const event = this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET ?? '',
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id ?? session.metadata?.userId;
        const subscriptionId = session.subscription as string | null;
        if (!userId || !subscriptionId) break;
        const sub = await this.stripe.subscriptions.retrieve(subscriptionId);
        await this.upsertSubscription(userId, sub);
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const existing = await this.prisma.subscription.findUnique({
          where: { stripeSubscriptionId: sub.id },
        });
        if (existing) await this.upsertSubscription(existing.userId, sub);
        break;
      }
      default:
        this.logger.debug(`Unhandled Stripe event: ${event.type}`);
    }
    return { received: true };
  }

  private async upsertSubscription(userId: string, sub: Stripe.Subscription) {
    const status =
      sub.status === 'active' || sub.status === 'trialing'
        ? 'ACTIVE'
        : sub.status === 'past_due'
          ? 'PAST_DUE'
          : 'CANCELED';
    const plan = this.planForPrice(sub.items.data[0]?.price?.id);
    await this.prisma.subscription.upsert({
      where: { stripeSubscriptionId: sub.id },
      create: {
        userId,
        stripeCustomerId: sub.customer as string,
        stripeSubscriptionId: sub.id,
        plan,
        status,
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
      },
      update: { status, plan, currentPeriodEnd: new Date(sub.current_period_end * 1000) },
    });
  }
}
