const TIME_FORMAT = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
});

const DATE_FORMAT = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const FULL_FORMAT = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  month: 'short',
  year: 'numeric',
});

function isToday(value: Date): boolean {
  const now = new Date();

  return (
    value.getFullYear() === now.getFullYear() &&
    value.getMonth() === now.getMonth() &&
    value.getDate() === now.getDate()
  );
}

export function formatMessageTime(iso: string): string {
  const value = new Date(iso);

  if (Number.isNaN(value.getTime())) {
    return '';
  }

  if (isToday(value)) {
    return TIME_FORMAT.format(value);
  }

  return `${DATE_FORMAT.format(value)}, ${TIME_FORMAT.format(value)}`;
}

export function formatAbsolute(iso: string): string {
  const value = new Date(iso);

  if (Number.isNaN(value.getTime())) {
    return '';
  }

  return FULL_FORMAT.format(value);
}

export function minutesBetween(left: string, right: string): number {
  const a = new Date(left).getTime();
  const b = new Date(right).getTime();

  if (Number.isNaN(a) || Number.isNaN(b)) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.abs(a - b) / 60_000;
}
