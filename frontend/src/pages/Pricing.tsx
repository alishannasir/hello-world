import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useBillingStatus, type Plan } from '../lib/billing';
import { useAuth } from '../store/auth';
import { ThemeToggle } from '../components/ThemeToggle';

// Euro-area countries; everyone else sees USD.
const EUR_REGIONS = new Set([
  'AT', 'BE', 'HR', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE',
  'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES',
]);

function detectCurrency(): 'EUR' | 'USD' {
  try {
    const locale = new Intl.Locale(navigator.language);
    const region =
      (locale as unknown as { maximize?: () => { region?: string } }).maximize?.().region ??
      locale.region;
    if (region && EUR_REGIONS.has(region)) return 'EUR';
  } catch {
    /* fall through to USD */
  }
  return 'USD';
}

function formatPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(navigator.language, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${amount}`;
  }
}

interface PlanCard {
  code: Extract<Plan, 'FREE' | 'STANDARD' | 'PREMIUM'>;
  name: string;
  price: number;
  popular?: boolean;
  features: string[];
}

const PLANS: PlanCard[] = [
  {
    code: 'FREE',
    name: 'Free',
    price: 0,
    features: [
      '30 minutes of chat per day',
      'Random 1:1 matching',
      'Ads shown',
      'No gender or country filters',
    ],
  },
  {
    code: 'STANDARD',
    name: 'Standard',
    price: 19,
    features: [
      'Up to 100 calls per day',
      '5 hours of chat per day',
      'Friend list up to 20 people',
      'No gender or country filters',
    ],
  },
  {
    code: 'PREMIUM',
    name: 'Premium',
    price: 29,
    popular: true,
    features: [
      'Unlimited calls',
      'Unlimited chat time',
      'Unlimited friend list',
      'No ads',
      'Gender + country filters',
    ],
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const token = useAuth((s) => s.token);
  const { data: billing } = useBillingStatus(Boolean(token));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const currency = detectCurrency();
  const currentPlan = billing?.plan ?? null;

  async function choose(plan: 'STANDARD' | 'PREMIUM') {
    if (!token) {
      navigate('/signup');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ url: string }>('/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan }),
      });
      window.location.assign(res.url);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-heading text-lg font-bold">
            Online Video Chat
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to={token ? '/home' : '/login'}
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
            >
              {token ? 'Dashboard' : 'Log in'}
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-center text-4xl font-bold">Pricing</h1>
        <p className="mt-3 text-center text-zinc-600 dark:text-zinc-400">
          Start free. Upgrade when you want more. Cancel anytime.
        </p>

        {billing?.plan === 'TRIAL' && (
          <p className="mx-auto mt-6 max-w-md rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-center text-sm">
            You are currently on a <strong>free trial</strong> with full access.
          </p>
        )}

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.code;
            return (
              <div
                key={plan.code}
                className={`relative flex flex-col rounded-2xl border p-6 ${
                  plan.popular
                    ? 'border-emerald-500 dark:border-emerald-400 shadow-lg'
                    : 'border-zinc-200 dark:border-zinc-800'
                } bg-white dark:bg-zinc-900`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-0.5 text-xs font-semibold text-zinc-950">
                    Most popular
                  </span>
                )}
                <h2 className="text-xl font-bold">{plan.name}</h2>
                <p className="mt-2">
                  <span className="text-3xl font-bold">{formatPrice(plan.price, currency)}</span>
                  <span className="text-sm text-zinc-500">/month</span>
                </p>
                <ul className="mt-6 flex flex-1 flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span aria-hidden="true" className="mt-0.5 text-emerald-500">
                        {'\u2713'}
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  {isCurrent ? (
                    <span className="block rounded-xl border border-emerald-500/50 py-3 text-center text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      Current plan
                    </span>
                  ) : plan.code === 'FREE' ? (
                    <Link
                      to={token ? '/home' : '/signup'}
                      className="block rounded-xl border border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 py-3 text-center font-semibold transition-colors"
                    >
                      {token ? 'Included' : 'Get started'}
                    </Link>
                  ) : (
                    <button
                      onClick={() => choose(plan.code as 'STANDARD' | 'PREMIUM')}
                      disabled={busy}
                      className={`w-full rounded-xl py-3 font-semibold transition-colors disabled:opacity-50 ${
                        plan.popular
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950'
                          : 'border border-zinc-300 dark:border-zinc-700 hover:border-emerald-400'
                      }`}
                    >
                      Choose {plan.name}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {error && <p className="mt-6 text-center text-sm text-red-600 dark:text-red-400">{error}</p>}
        <p className="mt-8 text-center text-xs text-zinc-500">
          Prices shown in {currency}. Billing is handled securely by Stripe.
        </p>
      </main>
    </div>
  );
}
