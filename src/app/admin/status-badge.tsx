const styles: Record<string, string> = {
  PAID: "bg-brand-soft text-brand",
  REFUNDED: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300",
  PENDING: "bg-surface text-muted",
  CANCELLED: "bg-surface text-muted line-through",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${styles[status] ?? styles.PENDING}`}>{status[0] + status.slice(1).toLowerCase()}</span>;
}
