import { useState, type FormEvent } from 'react';
import { useUsers } from '../hooks/useUsers';
import { StatusBadge } from '../components/StatusBadge';
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
  SuccessBanner,
} from '../components/States';
import { ApiError } from '../types';

export function UsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { result, loading, error, create } = useUsers(search, page);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSaving(true);
    try {
      const user = await create({ name, phone, email });
      setFormSuccess(`Created user ${user.email}`);
      setName('');
      setPhone('');
      setEmail('');
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  const users = result?.data ?? [];
  const meta = result?.meta;

  return (
    <div className="page">
      <header className="page-header">
        <h1>Users</h1>
      </header>

      <section className="panel">
        <h2>Create user</h2>
        {formError && <ErrorBanner message={formError} />}
        {formSuccess && <SuccessBanner message={formSuccess} />}
        <form className="form-grid" onSubmit={onCreate}>
          <label>
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label>
            Phone
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Create user'}
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="toolbar">
          <h2>User list</h2>
          <input
            className="search"
            placeholder="Search name, email, phone"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
        {error && <ErrorBanner message={error} />}
        {loading && <LoadingState />}
        {!loading && !error && users.length === 0 && (
          <EmptyState message="No users found." />
        )}
        {users.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Id</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.phone}</td>
                    <td>
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="mono">{u.id}</td>
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
