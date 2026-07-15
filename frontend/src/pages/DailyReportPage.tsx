import { useMemo, useState } from 'react';
import { useDailySummary } from '../hooks/useDailySummary';
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
} from '../components/States';

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DailyReportPage() {
  const [date, setDate] = useState(todayUtc);
  const { data, loading, error } = useDailySummary(date);

  const isEmpty = useMemo(() => {
    if (!data) return true;
    return (
      data.transactionCount === 0 &&
      data.totalCredits === '0.00' &&
      data.totalDebits === '0.00'
    );
  }, [data]);

  return (
    <div className="page">
      <header className="page-header">
        <h1>Daily report</h1>
        <p>UTC calendar day summary (zeros when no activity).</p>
      </header>

      <section className="panel">
        <label className="inline-label">
          Date (UTC)
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
      </section>

      {error && <ErrorBanner message={error} />}
      {loading && <LoadingState />}
      {!loading && !error && data && (
        <>
          {isEmpty && (
            <EmptyState message={`No activity on ${data.date} (showing zeros).`} />
          )}
          <div className="metric-grid">
            <article className="metric-card">
              <span className="metric-label">Date</span>
              <strong className="metric-value">{data.date}</strong>
            </article>
            <article className="metric-card">
              <span className="metric-label">Total credits</span>
              <strong className="metric-value">{data.totalCredits}</strong>
            </article>
            <article className="metric-card">
              <span className="metric-label">Total debits</span>
              <strong className="metric-value">{data.totalDebits}</strong>
            </article>
            <article className="metric-card">
              <span className="metric-label">Transactions</span>
              <strong className="metric-value">{data.transactionCount}</strong>
            </article>
            <article className="metric-card">
              <span className="metric-label">Active wallets</span>
              <strong className="metric-value">{data.activeWallets}</strong>
            </article>
          </div>
        </>
      )}
    </div>
  );
}
