import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import Redis from 'ioredis';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS } from '../redis/redis.module';
import { StripeService } from '../payments/stripe.service';

const STREAK_TARGET = Number(process.env.STREAK_TARGET ?? 10);
const STREAK_REWARD_CENTS = Number(process.env.STREAK_REWARD_CENTS ?? 500);
const RESET_LOCK_KEY = 'streaks:reset-lock';
const DAY_MS = 86_400_000;

@Injectable()
export class StreaksService {
  private readonly logger = new Logger(StreaksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  /** Midnight UTC of the given instant. */
  private utcDay(d: Date): Date {
    return new Date(d.toISOString().slice(0, 10));
  }

  /**
   * Records daily activity for a user (UTC day boundaries). Idempotent within
   * the same day. Increments the streak when the previous active day was
   * yesterday, otherwise restarts at 1. Only ever called server-side (from the
   * auth flow and authenticated streak reads) - never trusted from the client.
   */
  async recordActivity(userId: string): Promise<User> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const today = this.utcDay(new Date());
    const last = user.lastActiveDate ? this.utcDay(user.lastActiveDate) : null;

    if (last && last.getTime() === today.getTime()) return user; // already counted today

    const yesterday = new Date(today.getTime() - DAY_MS);
    const newStreak = last && last.getTime() === yesterday.getTime() ? user.currentStreak + 1 : 1;

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { currentStreak: newStreak, lastActiveDate: today },
    });

    // A reward is granted every STREAK_TARGET consecutive active days.
    if (newStreak % STREAK_TARGET === 0) {
      return this.grantReward(updated);
    }
    return updated;
  }

  /**
   * Grants the streak reward. The streak increments at most once per day, so
   * hitting a multiple of the target is a single event; the grants log adds a
   * second guard against double-granting within one cycle.
   */
  private async grantReward(user: User): Promise<User> {
    const cycleStart = new Date(this.utcDay(new Date()).getTime() - STREAK_TARGET * DAY_MS);
    const recent = await this.prisma.streakRewardGrant.findFirst({
      where: { userId: user.id, createdAt: { gte: cycleStart } },
    });
    if (recent) return user;

    const [updated, grant] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { creditCents: { increment: STREAK_REWARD_CENTS } },
      }),
      this.prisma.streakRewardGrant.create({
        data: { userId: user.id, streakLength: user.currentStreak, creditCents: STREAK_REWARD_CENTS },
      }),
    ]);

    // Issue the credit on the Stripe side; local creditCents remains the
    // display source of truth even if the Stripe call fails.
    const stripeRef = await this.stripe.grantAccountCredit(user.id, STREAK_REWARD_CENTS);
    if (stripeRef) {
      await this.prisma.streakRewardGrant.update({ where: { id: grant.id }, data: { stripeRef } });
    }
    this.logger.log(`Granted ${STREAK_REWARD_CENTS}c streak reward to user ${user.id}`);
    return updated;
  }

  /** Streak status for the authenticated user; the read itself counts as daily usage. */
  async getStatus(userId: string) {
    const user = await this.recordActivity(userId);
    const today = this.utcDay(new Date());
    const grantToday = await this.prisma.streakRewardGrant.findFirst({
      where: { userId, createdAt: { gte: today } },
    });
    return {
      currentStreak: user.currentStreak,
      lastActiveDate: user.lastActiveDate,
      creditCents: user.creditCents,
      streakTarget: STREAK_TARGET,
      rewardCents: STREAK_REWARD_CENTS,
      rewardEarned: Boolean(grantToday),
    };
  }

  /** Nightly reconciliation: zero out streaks for users who missed a day. */
  @Cron('15 0 * * *', { timeZone: 'UTC' })
  async resetLapsedStreaks() {
    // Redis lock so exactly one instance runs the job.
    const locked = await this.redis.set(RESET_LOCK_KEY, '1', 'EX', 3600, 'NX');
    if (!locked) return;
    const yesterday = new Date(this.utcDay(new Date()).getTime() - DAY_MS);
    const { count } = await this.prisma.user.updateMany({
      where: {
        currentStreak: { gt: 0 },
        OR: [{ lastActiveDate: null }, { lastActiveDate: { lt: yesterday } }],
      },
      data: { currentStreak: 0 },
    });
    if (count > 0) this.logger.log(`Reset lapsed streaks for ${count} users`);
  }
}
