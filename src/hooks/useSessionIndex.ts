'use client';

import { useEffect, useState } from 'react';
import { dashboardApi } from '@/lib/api/dashboard';
import { historyApi } from '@/lib/api/history';
import { reportApi } from '@/lib/api/report';
import {
  discoverSessions,
  pairWithDates,
  readSessions,
  rememberMany,
  withSession,
  type SessionRef,
} from '@/lib/sessionIndex';

export interface SessionIndex {
  sessions: SessionRef[];
  loading: boolean;
  idByDate: (date: string | null | undefined) => number | null;
}

export function useSessionIndex(): SessionIndex {
  const [sessions, setSessions] = useState<SessionRef[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      const latest = await dashboardApi
        .getReport()
        .then((res) => {
          const r = res.data.result;
          return r?.sessionId == null
            ? null
            : { sessionId: r.sessionId, scannedAt: r.scannedAt ?? '', score: r.averageScore };
        })
        .catch(() => null);

      const dates = await historyApi
        .getList({ period: 'ALL', size: 200 })
        .then((res) => (res.data.result?.items ?? []).map((i) => i.date))
        .catch(() => [] as string[]);

      let known = withSession(readSessions(), latest);

      if (known.length < dates.length && latest !== null) {
        const owns = (id: number) =>
          reportApi
            .getSessionReport(id)
            .then(() => true)
            .catch(() => false);

        const ids = await discoverSessions(latest.sessionId, owns, dates.length - 1);
        if (!alive) return;

        if (ids.length > 0) {
          known = withSession(rememberMany(pairWithDates([latest.sessionId, ...ids], dates)), latest);
        }
      }

      if (!alive) return;
      setSessions(known);
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  const idByDate = (date: string | null | undefined) => {
    if (!date) return null;
    const key = date.slice(0, 10);
    return sessions.find((s) => s.scannedAt.slice(0, 10) === key)?.sessionId ?? null;
  };

  return { sessions, loading, idByDate };
}
