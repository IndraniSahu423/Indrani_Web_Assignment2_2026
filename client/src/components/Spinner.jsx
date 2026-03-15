export default function Spinner({ label = "Loading…" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
      {label ? (
        <div className="text-xs font-medium tracking-wide text-slate-500">{label}</div>
      ) : null}
    </div>
  );
}

