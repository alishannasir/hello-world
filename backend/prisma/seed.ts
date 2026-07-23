/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// plan_limits is the source of truth for tier caps. null = unlimited.
// Standard friend cap is configurable; default 20.
const STANDARD_MAX_FRIENDS = parseInt(process.env.STANDARD_MAX_FRIENDS ?? '20', 10);

async function main() {
  const tiers = [
    // Free: 30 min of chat/day, ads, no filters.
    { plan: 'FREE', dailyMinutes: 30, dailyMatches: null, adsEnabled: true, filtersEnabled: false, maxFriends: null },
    // Standard ($19/mo): up to 100 calls/day, 5h chat/day, limited friend list.
    { plan: 'STANDARD', dailyMinutes: 300, dailyMatches: 100, adsEnabled: true, filtersEnabled: false, maxFriends: STANDARD_MAX_FRIENDS },
    // Premium ($29/mo): unlimited everything, no ads, gender+country filters.
    { plan: 'PREMIUM', dailyMinutes: null, dailyMatches: null, adsEnabled: false, filtersEnabled: true, maxFriends: null },
  ] as const;

  for (const tier of tiers) {
    const { plan, ...limits } = tier;
    await prisma.planLimit.upsert({ where: { plan }, update: limits, create: { plan, ...limits } });
  }

  // Legacy plans from earlier phases keep Premium-equivalent access.
  for (const plan of ['MONTHLY', 'ANNUAL'] as const) {
    await prisma.planLimit.upsert({
      where: { plan },
      update: {},
      create: { plan, dailyMinutes: null, dailyMatches: null, adsEnabled: false, filtersEnabled: true, maxFriends: null },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
