import { useEffect, useState } from 'react';
import { getSocket } from '../lib/socket';

/**
 * Live "X people online now" counter. The server pushes `online-count`
 * over the WebSocket on every connect/disconnect - no HTTP polling.
 */
export function OnlineCount({ className = '' }: { className?: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const socket = getSocket();
    const handler = (payload: { count: number }) => setCount(payload.count);
    socket.on('online-count', handler);
    return () => {
      socket.off('online-count', handler);
    };
  }, []);

  if (count === null) return null;

  return (
    <p className={`flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 ${className}`}>
      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
      <strong className="text-zinc-900 dark:text-zinc-100">{count.toLocaleString()}</strong>
      <span>{count === 1 ? 'person' : 'people'} online now</span>
    </p>
  );
}
