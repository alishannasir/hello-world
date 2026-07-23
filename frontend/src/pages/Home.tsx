import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { useFilters } from '../store/filters';
import { useBillingStatus } from '../lib/billing';
import { useStreakStatus } from '../lib/streaks';
import { OnlineCount } from '../components/OnlineCount';
import { ThemeToggle } from '../components/ThemeToggle';

const inputCls =
  'rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-4 py-3 focus:outline-none focus:border-emerald-500';

const cardCls = 'rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60';

export default function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { data: billing } = useBillingStatus(Boolean(user));
  const { data: streak } = useStreakStatus(Boolean(user));
  const filters = useFilters();

  if (!user) {
    navigate('/login');
    return null;
  }

  const trialDaysLeft = Math.max(
    0,
    Math.ceil((new Date(user.trialEndsAt).getTime() - Date.now()) / 86_400_000),
  );
  const isPaid = billing ? billing.plan !== 'FREE' && billing.plan !== 'TRIAL' : false;
  const capped = billing && (billing.dailyMinutes !== null || billing.dailyMatches !== null);

  const planLabel =
    billing?.plan === 'TRIAL'
      ? 'Free trial'
      : billing?.plan === 'FREE'
        ? 'Free'
        : billing?.plan === 'STANDARD'
          ? 'Standard'
          : 'Premium';

  // Streak: server data with optimistic fallback to the cached user while loading.
  const streakTarget = streak?.streakTarget ?? 10;
  const streakDays = streak?.currentStreak ?? user.currentStreak;
  const filledDots = streakDays === 0 ? 0 : ((streakDays - 1) % streakTarget) + 1;
  const creditCents = streak?.creditCents ?? user.creditCents;
  const rewardDollars = ((streak?.rewardCents ?? 500) / 100).toFixed(2);

  return (
    <main className="min-h-screen flex flex-col gap-6 p-6 max-w-md mx-auto">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Hey, {user.displayName ?? 'there'}</h1>
        <ThemeToggle />
      </header>

      <nav className="flex items-center gap-4 text-sm">
        <Link to="/friends" className="text-emerald-600 dark:text-emerald-400 hover:underline">
          Friends
        </Link>
        <Link to="/history" className="text-emerald-600 dark:text-emerald-400 hover:underline">
          History
        </Link>
        <Link to="/settings" className="text-emerald-600 dark:text-emerald-400 hover:underline">
          Settings
        </Link>
        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="ml-auto text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
        >
          Log out
        </button>
      </nav>

      <OnlineCount />

      {billing && (
        <div className={`flex items-center justify-between p-3 text-sm ${cardCls}`}>
          <span>
            Plan: <strong>{planLabel}</strong>
          </span>
          {!isPaid && (
            <Link
              to="/pricing"
              className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              See plans
            </Link>
          )}
        </div>
      )}

      {trialDaysLeft > 0 && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm">
          Free trial: <strong>{trialDaysLeft} day{trialDaysLeft === 1 ? '' : 's'}</strong> of full
          access left.
        </div>
      )}

      {capped && billing && (
        <div className={`p-4 text-sm flex flex-col gap-1 text-zinc-600 dark:text-zinc-300 ${cardCls}`}>
          {billing.dailyMinutes !== null && (
            <span>
              Chat time today: {billing.usage.minutesUsed} / {billing.dailyMinutes} min
            </span>
          )}
          {billing.dailyMatches !== null && (
            <span>
              Calls today: {billing.usage.matchesUsed} / {billing.dailyMatches}
            </span>
          )}
        </div>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Match preferences</h2>
        {billing?.filtersEnabled ? (
          <div className="flex gap-3">
            <select
              className={`${inputCls} flex-1`}
              value={filters.preferredGender ?? ''}
              onChange={(e) => filters.setPreferredGender(e.target.value || null)}
            >
              <option value="">Any gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
            <input
              type="text"
              maxLength={2}
              placeholder="Country (US)"
              className={`${inputCls} w-32 uppercase`}
              value={filters.preferredCountry ?? ''}
              onChange={(e) => filters.setPreferredCountry(e.target.value.toUpperCase() || null)}
            />
          </div>
        ) : billing?.newAccountRestricted ? (
          <p className={`p-4 text-sm text-zinc-600 dark:text-zinc-400 ${cardCls}`}>
            Filters are locked for brand-new accounts and unlock automatically after a short
            waiting period.
          </p>
        ) : (
          <p className={`p-4 text-sm text-zinc-600 dark:text-zinc-400 ${cardCls}`}>
            Gender and country filters are a{' '}
            <Link to="/pricing" className="text-emerald-600 dark:text-emerald-400 hover:underline">
              Premium
            </Link>{' '}
            feature.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Streak:{' '}
            <strong className="text-zinc-900 dark:text-zinc-200">
              {streakDays} day{streakDays === 1 ? '' : 's'}
            </strong>{' '}
            · reach {streakTarget} for ${rewardDollars} credit
          </p>
          {creditCents > 0 && (
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              ${(creditCents / 100).toFixed(2)} credit
            </span>
          )}
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: streakTarget }).map((_, i) => (
            <span
              key={i}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                i < filledDots ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
            />
          ))}
        </div>
        {streak?.rewardEarned && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm">
            🎉 <strong>{streakTarget}-day streak!</strong> A ${rewardDollars} credit was added. It
            applies at your next checkout.
          </div>
        )}
      </section>

      <div className="mt-auto">
        <button
          onClick={() => navigate('/call')}
          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold py-4 text-lg transition-colors"
        >
          Start Chat
        </button>
      </div>
    </main>
  );
}
