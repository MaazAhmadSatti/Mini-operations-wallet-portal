export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return <div className="state state-loading">{label}</div>;
}

export function EmptyState({ message }: { message: string }) {
  return <div className="state state-empty">{message}</div>;
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="banner banner-error" role="alert">
      {message}
    </div>
  );
}

export function SuccessBanner({ message }: { message: string }) {
  return <div className="banner banner-success">{message}</div>;
}
