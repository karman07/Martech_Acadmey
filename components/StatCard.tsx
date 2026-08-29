export default function StatCard({
  label,
  value,
  sublabel,
  icon,
}: {
  label: string;
  value: string;
  sublabel?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
          {icon}
        </span>
        {sublabel && <span className="text-xs font-semibold text-muted">{sublabel}</span>}
      </div>
      <p className="mt-4 font-sans text-2xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  );
}
