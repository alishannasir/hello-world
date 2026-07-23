import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth, type User } from '../store/auth';

const MAX_GENDER_CHANGES = 3;

const COUNTRIES: Array<{ code: string; name: string }> = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'IE', name: 'Ireland' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'PT', name: 'Portugal' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czechia' },
  { code: 'GR', name: 'Greece' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'QA', name: 'Qatar' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'IN', name: 'India' },
  { code: 'TR', name: 'Türkiye' },
];

const inputCls =
  'w-full rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-4 py-3 focus:outline-none focus:border-emerald-500 disabled:opacity-50';

type Me = User & { genderChangeCount?: number };

export default function Settings() {
  const navigate = useNavigate();
  const token = useAuth((s) => s.token);
  const setUser = useAuth((s) => s.setUser);
  const [me, setMe] = useState<Me | null>(null);
  const [gender, setGender] = useState('');
  const [country, setCountry] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Me>('/users/me')
      .then((data) => {
        setMe(data);
        setGender(data.gender ?? '');
        setCountry(data.country ?? '');
      })
      .catch((err) => setError((err as Error).message));
  }, []);

  if (!token) {
    navigate('/login');
    return null;
  }

  const changesUsed = me?.genderChangeCount ?? 0;
  const remaining = Math.max(0, MAX_GENDER_CHANGES - changesUsed);
  const genderLocked = Boolean(me?.gender) && remaining === 0;

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!me) return;
    setBusy(true);
    setMessage(null);
    setError(null);
    const body: Record<string, string> = {};
    if (gender && gender !== (me.gender ?? '')) body.gender = gender;
    if (country && country !== (me.country ?? '')) body.country = country;
    if (Object.keys(body).length === 0) {
      setMessage('Nothing to save.');
      setBusy(false);
      return;
    }
    try {
      const updated = await api<Me>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      setMe(updated);
      setUser(updated);
      setMessage('Profile updated.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col gap-6 p-6 max-w-md mx-auto">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Link
          to="/home"
          className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
        >
          Back home
        </Link>
      </header>

      <form onSubmit={save} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="gender" className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            Gender
          </label>
          <select
            id="gender"
            className={inputCls}
            value={gender}
            disabled={genderLocked || !me}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="">Select…</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
          <p className="text-xs text-zinc-500">
            {genderLocked
              ? `You have used all ${MAX_GENDER_CHANGES} gender changes on this account.`
              : me?.gender
                ? `${remaining} of ${MAX_GENDER_CHANGES} changes remaining.`
                : `Setting your gender the first time is free; after that you can change it up to ${MAX_GENDER_CHANGES} times.`}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="country" className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            Country
          </label>
          <select
            id="country"
            className={inputCls}
            value={country}
            disabled={!me}
            onChange={(e) => setCountry(e.target.value)}
          >
            <option value="">Select…</option>
            {COUNTRIES.map(({ code, name }) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
          <p className="text-xs text-zinc-500">You can change your country anytime.</p>
        </div>

        <button
          type="submit"
          disabled={busy || !me}
          className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold py-3 transition-colors disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Save changes'}
        </button>

        {message && <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>}
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </form>
    </main>
  );
}
