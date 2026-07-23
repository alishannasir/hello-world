import { useQuery } from '@tanstack/react-query';
import { api } from './api';

export interface StreakStatus {
  currentStreak: number;
  lastActiveDate: string | null;
  creditCents: number;
  streakTarget: number;
  rewardCents: number;
  rewardEarned: boolean;
}

export function useStreakStatus(enabled = true) {
  return useQuery({
    queryKey: ['streak-status'],
    queryFn: () => api<StreakStatus>('/streaks/me'),
    enabled,
    staleTime: 30_000,
  });
}
