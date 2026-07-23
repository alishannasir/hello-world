import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../store/auth';

interface UserRef {
  id: string;
  displayName: string | null;
  email: string;
  status?: string;
}

interface Report {
  id: string;
  reasonCode: string;
  status: string;
  createdAt: string;
  sessionId: string | null;
  reporter: UserRef;
  reported: UserRef;
}

interface Scan {
  id: string;
  label: string;
  score: number;
  action: string;
  createdAt: string;
  user: UserRef;
}

type Tab = 'reports' | 'scans';

const chip = 'rounded-lg px-2 py-0.5 text-xs font-semibold';
const actionBtn =
  'rounded-lg border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 text-xs transition-colors';

function statusChip(status: string) {
  const colors: Record<string, string> = {
    OPEN: 'bg-amber-500/20 text-amber-300',
    REVIEWING: 'bg-sky-500/20 text-sky-300',
    RESOLVED: 'bg-emerald-500/20 text-emerald-300',
    DISMISSED: 'bg-zinc-700 text-zinc-300',
    ACTIVE: 'bg-emerald-500/20 text-emerald-300',
    SUSPENDED: 'bg-amber-500/20 text-amber-300',
    BANNED: 'bg-red-500/20 text-red-300',
    ESCALATED: 'bg-red-500/20 text-red-300',
    TERMINATED: 'bg-amber-500/20 text-amber-300',
    FLAGGED: 'bg-zinc-700 text-zinc-300',
  };
  return `${chip} ${colors[status] ?? 'bg-zinc-700 text-zinc-300'}`;
}

export default function Admin() {
  const navigate = useNavigate();
  const token = useAuth((s) => s.token);
  const [tab, setTab] = useState<Tab>('reports');
  const [reports, setReports] = useState<Report[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [r, s] = await Promise.all([
        api<Report[]>('/admin/reports'),
        api<Scan[]>('/admin/scans?reviewed=false'),
      ]);
      setReports(r);
      setScans(s);
    } catch (err) {
      const message = (err as Error).message;
      if (message.toLowerCase().includes('staff')) {
        setForbidden(true);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    load();
  }, [token, navigate, load]);

  async function updateReport(id: string, status: string) {
    try {
      await api(`/admin/reports/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function setUserStatus(userId: string, status: string) {
    try {
      await api(`/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setReports((prev) =>
        prev.map((r) =>
          r.reported.id === userId ? { ...r, reported: { ...r.reported, status } } : r,
        ),
      );
      setScans((prev) =>
        prev.map((s) => (s.user.id === userId ? { ...s, user: { ...s.user, status } } : s)),
      );
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function markReviewed(id: string) {
    try {
      await api(`/admin/scans/${id}/reviewed`, { method: 'PATCH' });
      setScans((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (forbidden) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-xl font-bold">Moderator access required</h1>
        <p className="text-zinc-400">Your account does not have staff permissions.</p>
        <button
          onClick={() => navigate('/home')}
          className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold px-6 py-3 transition-colors"
        >
          Back home
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-3xl mx-auto flex flex-col gap-4 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Moderation queue</h1>
        <button onClick={load} className={actionBtn}>
          Refresh
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab('reports')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
            tab === 'reports' ? 'bg-emerald-500 text-zinc-950' : 'border border-zinc-700'
          }`}
        >
          Reports ({reports.filter((r) => r.status === 'OPEN').length} open)
        </button>
        <button
          onClick={() => setTab('scans')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
            tab === 'scans' ? 'bg-emerald-500 text-zinc-950' : 'border border-zinc-700'
          }`}
        >
          Auto-flags ({scans.length})
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {loading && <p className="text-sm text-zinc-500">{'Loading\u2026'}</p>}

      {tab === 'reports' && !loading && (
        <ul className="flex flex-col gap-3">
          {reports.length === 0 && <li className="text-zinc-500">No reports. All clear.</li>}
          {reports.map((r) => (
            <li key={r.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={statusChip(r.status)}>{r.status}</span>
                <span className={`${chip} bg-zinc-800 text-zinc-200`}>{r.reasonCode}</span>
                <span className="text-xs text-zinc-500 ml-auto">
                  {new Date(r.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm">
                <span className="text-zinc-400">Reported:</span>{' '}
                {r.reported.displayName ?? r.reported.email}{' '}
                {r.reported.status && <span className={statusChip(r.reported.status)}>{r.reported.status}</span>}
              </p>
              <p className="text-xs text-zinc-500">
                By {r.reporter.displayName ?? r.reporter.email}
                {r.sessionId ? ` \u00b7 session ${r.sessionId}` : ''}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {r.status === 'OPEN' && (
                  <button onClick={() => updateReport(r.id, 'REVIEWING')} className={actionBtn}>
                    Start review
                  </button>
                )}
                {(r.status === 'OPEN' || r.status === 'REVIEWING') && (
                  <>
                    <button onClick={() => updateReport(r.id, 'RESOLVED')} className={actionBtn}>
                      Resolve
                    </button>
                    <button onClick={() => updateReport(r.id, 'DISMISSED')} className={actionBtn}>
                      Dismiss
                    </button>
                  </>
                )}
                {r.reported.status !== 'BANNED' ? (
                  <>
                    <button
                      onClick={() => setUserStatus(r.reported.id, 'SUSPENDED')}
                      className={`${actionBtn} text-amber-300`}
                    >
                      Suspend user
                    </button>
                    <button
                      onClick={() => setUserStatus(r.reported.id, 'BANNED')}
                      className={`${actionBtn} text-red-400`}
                    >
                      Ban user
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setUserStatus(r.reported.id, 'ACTIVE')}
                    className={`${actionBtn} text-emerald-400`}
                  >
                    Reactivate user
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {tab === 'scans' && !loading && (
        <ul className="flex flex-col gap-3">
          {scans.length === 0 && <li className="text-zinc-500">No unreviewed auto-flags.</li>}
          {scans.map((s) => (
            <li key={s.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={statusChip(s.action)}>{s.action}</span>
                <span className={`${chip} bg-zinc-800 text-zinc-200`}>{s.label}</span>
                <span className={`${chip} bg-zinc-800 text-zinc-200`}>{Math.round(s.score * 100)}%</span>
                <span className="text-xs text-zinc-500 ml-auto">
                  {new Date(s.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm">
                <span className="text-zinc-400">User:</span> {s.user.displayName ?? s.user.email}{' '}
                {s.user.status && <span className={statusChip(s.user.status)}>{s.user.status}</span>}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button onClick={() => markReviewed(s.id)} className={actionBtn}>
                  Mark reviewed
                </button>
                {s.user.status !== 'BANNED' ? (
                  <button
                    onClick={() => setUserStatus(s.user.id, 'BANNED')}
                    className={`${actionBtn} text-red-400`}
                  >
                    Ban user
                  </button>
                ) : (
                  <button
                    onClick={() => setUserStatus(s.user.id, 'ACTIVE')}
                    className={`${actionBtn} text-emerald-400`}
                  >
                    Reactivate user
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
