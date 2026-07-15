import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { StatusBadge } from '../components/StatusBadge';
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
  SuccessBanner,
} from '../components/States';
import { ApiError } from '../types';

export function WalletDetailPage() {
  const { id = '' } = useParams();
  const { wallet, txns, loading, error, credit, debit } = useWallet(id);

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [action, setAction] = useState<'credit' | 'debit'>('credit');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!/^\d+(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) {
      setFormError('Amount must be a positive number with up to 2 decimals');
      return;
    }

    setSaving(true);
    try {
      const txn =
        action === 'credit'
          ? await credit(amount, description || undefined)
          : await debit(amount, description || undefined);
      setFormSuccess(
        `${action} ok · ref ${txn.referenceId} · balance ${txn.balanceAfter}`,
      );
      setAmount('');
      setDescription('');
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : `${action} failed`);
    } finally {
      setSaving(false);
    }
  };

  const transactions = txns?.data ?? [];

  return (
    <div className="page">
      <header className="page-header">
        <p className="crumb">
          <Link to="/wallets">Wallets</Link> / detail
        </p>
        <h1>Wallet detail</h1>
      </header>

      {error && <ErrorBanner message={error} />}
      {loading && <LoadingState />}

      {wallet && (
        <>
          <section className="panel metric-row">
            <div>
              <span className="metric-label">Balance</span>
              <strong className="metric-value">{wallet.balance}</strong>
              <span className="muted"> {wallet.currency}</span>
            </div>
            <div>
              <span className="metric-label">Status</span>
              <div>
                <StatusBadge status={wallet.status} />
              </div>
            </div>
            <div>
              <span className="metric-label">Wallet id</span>
              <div className="mono">{wallet.id}</div>
            </div>
            <div>
              <span className="metric-label">Owner user id</span>
              <div className="mono">{wallet.userId}</div>
            </div>
          </section>

          <section className="panel">
            <h2>Credit / debit</h2>
            {formError && <ErrorBanner message={formError} />}
            {formSuccess && <SuccessBanner message={formSuccess} />}
            <form className="form-grid" onSubmit={onSubmit}>
              <label>
                Action
                <select
                  value={action}
                  onChange={(e) =>
                    setAction(e.target.value as 'credit' | 'debit')
                  }
                >
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                </select>
              </label>
              <label>
                Amount
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="10.50"
                  required
                />
              </label>
              <label>
                Description
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional"
                />
              </label>
              <button type="submit" disabled={saving}>
                {saving ? 'Submitting…' : `Submit ${action}`}
              </button>
            </form>
          </section>

          <section className="panel">
            <h2>Transactions</h2>
            {transactions.length === 0 && (
              <EmptyState message="No transactions yet." />
            )}
            {transactions.length > 0 && (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Before</th>
                      <th>After</th>
                      <th>Reference</th>
                      <th>Created (UTC)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id}>
                        <td>{t.type}</td>
                        <td className="mono">{t.amount}</td>
                        <td className="mono">{t.balanceBefore}</td>
                        <td className="mono">{t.balanceAfter}</td>
                        <td className="mono">{t.referenceId}</td>
                        <td>{new Date(t.createdAt).toISOString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
