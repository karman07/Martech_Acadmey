const STATUS_CLASSES: Record<string, string> = {
  draft: "bg-background-soft text-muted border border-border",
  pending_review: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25",
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25",
  processing: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25",
  published: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25",
  approved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25",
  paid: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25",
  rejected: "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/25",
  info_requested: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25",
  unsubmitted: "bg-background-soft text-muted border border-border",
};

export default function Badge({ status }: { status: string }) {
  const classes = STATUS_CLASSES[status] ?? "bg-background-soft text-muted border border-border";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${classes}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
