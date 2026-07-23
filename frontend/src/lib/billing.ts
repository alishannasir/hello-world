import { useQuery } from '@tanstack/react-query';
import { api } from './api';

export type Plan = 'TRIAL' | 'FREE' | 'STANDARD' | 'PREMIUM' | 'MONTHLY' | 'ANNUAL';

export interface BillingStatus {
  plan: Plan;
  adsEnabled: boolean;
  filtersEnabled: boolean;
  dailyMinutes: number | null;
  dailyMatches: number | null;
  maxFriends: number | null;
  newAccountRestricted: boolean;
  usage: { minutesUsed: number; matchesUsed: number };
  trialEndsAt: string;
}

export function useBillingStatus(enabled = true) {
  return useQuery({
    queryKey: ['billing-status'],
    queryFn: () => api<BillingStatus>('/billing/status'),
    enabled,
    staleTime: 30_000,
  });
}
