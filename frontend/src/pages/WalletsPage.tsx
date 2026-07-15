import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useWallets } from '../hooks/useWallets';
import { StatusBadge } from '../components/StatusBadge';
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
  SuccessBanner,
} from '../components/States';
import { ApiError } from '../types';

export function WalletsPage() {
  const [page, setPage] = useState(1);
  const [userIdFilter, setUserIdFilter] = useState('');
  const { result, loading, error, create } = useWallets(
    page,
    userIdFilter.trim() || undefined,
  );

  const [userId, setUserId] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSaving(true);
    try {
      const wallet = await create({
        userId: userId.trim(),
        currency: currency.trim().toUpperCase(),
      });
      setFormSuccess(`Created wallet ${wallet.id}`);
      setUserId('');
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  const wallets = result?.data ?? [];
  const meta = result?.meta;

  return (
    <div className="page">
      <header className="page-header">
        <h1>Wallets</h1>
      </header>

      <section className="panel">
        <h2>Create wallet</h2>
        {formError && <ErrorBanner message={formError} />}
        {formSuccess && <SuccessBanner message={formSuccess} />}
        <form className="form-grid" onSubmit={onCreate}>
          <label>
            User id
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="UUID from Users page"
              required
            />
          </label>
          <label>
            Currency
            <input
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              required
            />
          </label>
          <button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Create wallet'}
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="toolbar">
          <h2>Wallet list</h2>
          <input
            className="search"
            placeholder="Filter by userId (optional)"
            value={userIdFilter}
            onChange={(e) => {
              setPage(1);
              setUserIdFilter(e.target.value);
            }}
          />
        </div>
        {error && <ErrorBanner message={error} />}
        {loading && <LoadingState />}
        {!loading && !error && wallets.length === 0 && (
          <EmptyState message="No wallets found." />
        )}
        {wallets.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Currency</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>User id</th>
                  <th>Wallet id</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {wallets.map((w) => (
                  <tr key={w.id}>
                    <td>{w.currency}</td>
                    <td className="mono">{w.balance}</td>
                    <td>
                      <StatusBadge status={w.status} />
                    </td>
                    <td className="mono">{w.userId}</td>
                    <td className="mono">{w.id}</td>
                    <td>
                      <Link to={`/wallets/${w.id}`}>Open</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {meta && meta.total > meta.limit && (
          <div className="pager">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </button>
            <span>
              Page {meta.page} · {meta.total} total
            </span>
            <button
              type="button"
              disabled={page * meta.limit >= meta.total}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
