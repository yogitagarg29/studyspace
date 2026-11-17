export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function formatLongDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatShortDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function formatDueLabel(iso: string): string {
  const today = todayISO();
  if (iso === today) return 'Today';
  if (iso === toISODate(addDays(new Date(), 1))) return 'Tomorrow';
  if (iso === toISODate(addDays(new Date(), -1))) return 'Yesterday';
  return formatShortDate(iso);
}

export function isOverdue(iso: string): boolean {
  return iso < todayISO();
}

/** Last `count` days ending today, oldest first: [{ iso, label }] */
export function lastNDays(count: number): { iso: string; label: string }[] {
  const days: { iso: string; label: string }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = addDays(new Date(), -i);
    days.push({
      iso: toISODate(d),
      label: d.toLocaleDateString(undefined, { weekday: 'short' }),
    });
  }
  return days;
}
