import { useCallback, useEffect, useState } from 'react';
import { getDailySummary } from '../api/reports';
import type { DailySummary } from '../types';
import { ApiError } from '../types';

export function useDailySummary(date: string) {
  const [data, setData] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!date) return;
    setLoading(true);
    setError(null);
    try {
      setData(await getDailySummary(date));
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : 'Failed to load daily summary',
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}
