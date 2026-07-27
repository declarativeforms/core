export function isEmailValid(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function toFieldString(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (value === undefined || value === null) {
    return '';
  }

  return String(value);
}

export function sanitizeOtpCode(value: string): string {
  return value.replace(/\D/g, '').slice(0, 6);
}
