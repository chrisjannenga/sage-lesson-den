'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const DONE_KEY = 'sage-den-done-v2';
const PEND_KEY = 'sage-den-pending-v2';

export type Status = 'loading' | 'synced' | 'saving' | 'offline';
type Pending = Record<string, boolean>;

function readLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeLS(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode or full storage: the server copy still works */
  }
}

/**
 * Check-offs are shown instantly (optimistic) and saved to /api/progress.
 * Changes made while offline wait in a small queue on the device and are sent
 * when the connection returns. The server list is re-read every 20 seconds
 * while the page is visible, so a tick on one device appears on the others.
 */
export function useProgress() {
  const [done, setDone] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<Status>('loading');
  const server = useRef<Set<string>>(new Set());
  const pending = useRef<Pending>({});
  const inflight = useRef(false);

  const recompute = useCallback(() => {
    const s = new Set(server.current);
    for (const [id, on] of Object.entries(pending.current)) {
      if (on) s.add(id);
      else s.delete(id);
    }
    setDone(s);
    writeLS(DONE_KEY, [...s]);
  }, []);

  const sync = useCallback(async () => {
    if (inflight.current) return;
    inflight.current = true;
    let ok = false;
    try {
      const ops = Object.entries(pending.current).map(([id, on]) => ({ id, on }));
      let res: Response;
      if (ops.length) {
        setStatus('saving');
        res = await fetch('/api/progress', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ ops }),
        });
      } else {
        res = await fetch('/api/progress', { cache: 'no-store' });
      }
      if (!res.ok) throw new Error('request failed');
      const body = (await res.json()) as { done: string[] };
      for (const o of ops) {
        if (pending.current[o.id] === o.on) delete pending.current[o.id];
      }
      writeLS(PEND_KEY, pending.current);
      server.current = new Set(body.done);
      recompute();
      setStatus('synced');
      ok = true;
    } catch {
      setStatus('offline');
    } finally {
      inflight.current = false;
    }
    if (ok && Object.keys(pending.current).length) void sync();
  }, [recompute]);

  const toggleMany = useCallback(
    (ids: string[], on: boolean) => {
      ids.forEach((id) => {
        pending.current[id] = on;
      });
      writeLS(PEND_KEY, pending.current);
      recompute();
      void sync();
    },
    [recompute, sync],
  );

  useEffect(() => {
    const cached = readLS<string[]>(DONE_KEY, []);
    pending.current = readLS<Pending>(PEND_KEY, {});
    server.current = new Set(cached);
    setDone(new Set(cached));
    void sync();

    const tick = () => {
      if (!document.hidden) void sync();
    };
    const timer = window.setInterval(tick, 20000);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('online', tick);
    window.addEventListener('focus', tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('online', tick);
      window.removeEventListener('focus', tick);
    };
  }, [sync]);

  return { done, status, toggleMany };
}
