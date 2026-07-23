import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../store/auth';

interface HistoryItem {
  sessionId: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  peer: {
    userId: string;
    displayName: string | null;
    avatarUrl: string | null;
    country: string | null;
  };
  friendStatus: 'ACCEPTED' | 'PENDING' | null;
}

interface HistoryPage {
  items: HistoryItem[];
  nextCursor: string | null;
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return 'In progress';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function History() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requested, setRequested] = useState<Record<string, boolean>>({});
  const sentinel = useRef<HTMLDivElement>(null);

  async function fetchPage(cur: string | null) {
    setLoading(true);
    setError(null);
    try {
      const page = await api<HistoryPage>(
        `/users/me/history${cur ? `?cursor=${encodeURIComponent(cur)}` : ''}`,
      );
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
      setHasMore(Boolean(page.nextCursor));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPage(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Infinite scroll: load the next page when the sentinel becomes visible.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading && hasMore) fetchPage(cursor);
    });
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, hasMore, loading]);

  async function addFriend(userId: string) {
    try {
      await api('/friends/requests', { method: 'POST', body: JSON.stringify({ userId }) });
      setRequested((prev) => ({ ...prev, [userId]: true }));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <main className="min-h-screen flex flex-col gap-6 p-6 max-w-md mx-auto">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">History</h1>
        <Link
          to="/home"
          className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
        >
          Back home
        </Link>
      </header>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {items.length === 0 && !loading && !error && (
        <p className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-4 text-sm text-zinc-600 dark:text-zinc-400">
          No calls yet. Start a chat to meet someone new!
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li
            key={item.sessionId}
            className="flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3"
          >
            {item.peer.avatarUrl ? (
              <img
                src={item.peer.avatarUrl}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 font-semibold">
                {(item.peer.displayName ?? '?').charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{item.peer.displayName ?? 'Anonymous'}</p>
              <p className="text-xs text-zinc-500">
                {new Date(item.startedAt).toLocaleString()} · {formatDuration(item.durationSeconds)}
              </p>
            </div>
            {item.friendStatus === 'ACCEPTED' ? (
              <span className="text-xs text-zinc-500">Friends</span>
            ) : item.friendStatus === 'PENDING' || requested[item.peer.userId] ? (
              <span className="text-xs text-zinc-500">Request sent</span>
            ) : (
              <button
                onClick={() => addFriend(item.peer.userId)}
                className="rounded-lg border border-emerald-500/50 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
              >
                Add Friend
              </button>
            )}
          </li>
        ))}
      </ul>

      {loading && <p className="text-center text-sm text-zinc-500">Loading…</p>}
      {/* Sentinel for infinite scroll */}
      <div ref={sentinel} aria-hidden="true" className="h-1" />
    </main>
  );
}
