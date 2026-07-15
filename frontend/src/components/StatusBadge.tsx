export function StatusBadge({
  status,
}: {
  status: string;
}) {
  const tone =
    status === 'active'
      ? 'badge-ok'
      : status === 'frozen' || status === 'inactive'
        ? 'badge-warn'
        : 'badge-muted';
  return <span className={`badge ${tone}`}>{status}</span>;
}
