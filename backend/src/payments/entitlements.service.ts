import { Injectable } from '@nestjs/common';
import { SubscriptionPlan, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface Entitlement {
  plan: SubscriptionPlan | 'TRIAL';
  adsEnabled: boolean;
  filtersEnabled: boolean;
  dailyMinutes: number | null;
  dailyMatches: number | null;
  maxFriends: number | null;
  newAccountRestricted: boolean;
}

@Injectable()
export class EntitlementsService {
  constructor(private readonly prisma: PrismaService) {}

  private minAccountAgeHours(): number {
    return parseFloat(process.env.MIN_ACCOUNT_AGE_HOURS ?? '24');
  }

  /** Anti-abuse: brand-new accounts don't get filters or checkout access. */
  private isNewAccountRestricted(user: User): boolean {
    const hours = this.minAccountAgeHours();
    if (!Number.isFinite(hours) || hours <= 0) return false;
    return Date.now() - user.createdAt.getTime() < hours * 3_600_000;
  }

  async entitlementFor(user: User): Promise<Entitlement> {
    const restricted = this.isNewAccountRestricted(user);

    // 3-day trial: full access regardless of subscription. Filters remain
    // age-gated even during trial to deter throwaway-account abuse.
    if (user.trialEndsAt.getTime() > Date.now()) {
      return {
        plan: 'TRIAL',
        adsEnabled: false,
        filtersEnabled: !restricted,
        dailyMinutes: null,
        dailyMatches: null,
        maxFriends: null,
        newAccountRestricted: restricted,
      };
    }

    const sub = await this.prisma.subscription.findFirst({
      where: { userId: user.id, status: 'ACTIVE' },
      orderBy: { currentPeriodEnd: 'desc' },
    });
    const plan: SubscriptionPlan = sub?.plan ?? 'FREE';

    const limits = await this.prisma.planLimit.findUnique({ where: { plan } });
    if (limits) {
      return {
        plan,
        adsEnabled: limits.adsEnabled,
        filtersEnabled: limits.filtersEnabled && !restricted,
        dailyMinutes: limits.dailyMinutes,
        dailyMatches: limits.dailyMatches,
        maxFriends: limits.maxFriends,
        newAccountRestricted: restricted,
      };
    }

    // Fallback if plan_limits is not seeded; the table remains the source of truth.
    return plan === 'FREE'
      ? {
          plan,
          adsEnabled: true,
          filtersEnabled: false,
          dailyMinutes: 30,
          dailyMatches: 20,
          maxFriends: null,
          newAccountRestricted: restricted,
        }
      : {
          plan,
          adsEnabled: false,
          filtersEnabled: !restricted,
          dailyMinutes: null,
          dailyMatches: null,
          maxFriends: null,
          newAccountRestricted: restricted,
        };
  }

  /** Anti-abuse gate for Stripe checkout. Enforced server-side. */
  canPurchase(user: User): { ok: true } | { ok: false; reason: string } {
    if (this.isNewAccountRestricted(user)) {
      const hours = this.minAccountAgeHours();
      return {
        ok: false,
        reason: `New accounts can subscribe after ${hours} hours. Enjoy your free trial in the meantime.`,
      };
    }
    return { ok: true };
  }

  async usageToday(userId: string) {
    const date = new Date(new Date().toISOString().slice(0, 10)); // midnight UTC
    const usage = await this.prisma.dailyUsage.findUnique({
      where: { userId_date: { userId, date } },
    });
    return { minutesUsed: usage?.minutesUsed ?? 0, matchesUsed: usage?.matchesUsed ?? 0 };
  }

  /** Server-side gate for starting a match. Never trust the client. */
  async canStartMatch(
    user: User,
  ): Promise<{ ok: true; entitlement: Entitlement } | { ok: false; reason: string }> {
    const entitlement = await this.entitlementFor(user);
    if (entitlement.dailyMinutes === null && entitlement.dailyMatches === null) {
      return { ok: true, entitlement };
    }
    const usage = await this.usageToday(user.id);
    if (entitlement.dailyMinutes !== null && usage.minutesUsed >= entitlement.dailyMinutes) {
      return { ok: false, reason: 'You have used your free chat time for today. Upgrade for unlimited chat.' };
    }
    if (entitlement.dailyMatches !== null && usage.matchesUsed >= entitlement.dailyMatches) {
      return { ok: false, reason: 'You have reached your free match limit for today. Upgrade for unlimited matches.' };
    }
    return { ok: true, entitlement };
  }
}
