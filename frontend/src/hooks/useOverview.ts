import { useCallback, useEffect, useState } from 'react';
import { getOverview } from '../api/reports';
import type { OverviewReport } from '../types';
import { ApiError } from '../types';

export function useOverview() {
  const [data, setData] = useState<OverviewReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getOverview());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load overview');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}
