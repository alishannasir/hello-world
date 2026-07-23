-- Phase 8: three-tier public plans, gender change limit, friend list cap
ALTER TYPE "SubscriptionPlan" ADD VALUE IF NOT EXISTS 'STANDARD';
ALTER TYPE "SubscriptionPlan" ADD VALUE IF NOT EXISTS 'PREMIUM';

-- Total gender changes ever made on the account (initial set not counted).
ALTER TABLE "users" ADD COLUMN "genderChangeCount" INTEGER NOT NULL DEFAULT 0;

-- Friend list cap per plan; NULL = unlimited.
ALTER TABLE "plan_limits" ADD COLUMN "maxFriends" INTEGER;
