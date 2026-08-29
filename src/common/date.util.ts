const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
}

export function lastNMonths(n: number) {
  const now = new Date();
  const result: { key: string; label: string }[] = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    result.push({ key: monthKey(date), label: MONTH_LABELS[date.getUTCMonth()] });
  }
  return result;
}
