import { useOverview } from '../hooks/useOverview';
import { EmptyState, ErrorBanner, LoadingState } from '../components/States';

export function DashboardPage() {
  const { data, loading, error } = useOverview();

  return (
    <div className="page">
      <header className="page-header">
        <h1>Dashboard</h1>
      </header>

      {error && <ErrorBanner message={error} />}
      {loading && <LoadingState />}
      {!loading && !error && !data && (
        <EmptyState message="No overview data available." />
      )}
      {data && (
        <div className="metric-grid">
          <article className="metric-card">
            <span className="metric-label">Total wallets</span>
            <strong className="metric-value">{data.totalWallets}</strong>
          </article>
          <article className="metric-card">
            <span className="metric-label">Total balance</span>
            <strong className="metric-value">{data.totalBalance}</strong>
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
        </div>
      )}
    </div>
  );
}
