type ThemeOverrides = {
  primary?: string;
};

function toRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace(/^#/, '');

  if (!/^(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(cleaned)) {
    return null;
  }

  const normalized =
    cleaned.length === 3 ? cleaned.replace(/./g, '$&$&') : cleaned;
  const value = Number.parseInt(normalized, 16);

  return {
    r: value >> 16,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function calculateRelativeLuminance(
  red: number,
  green: number,
  blue: number,
): number {
  const [rs, gs, bs] = [red / 255, green / 255, blue / 255].map((channel) =>
    channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4),
  );

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function buildThemeStyle(
  theme: ThemeOverrides | undefined,
): React.CSSProperties | undefined {
  if (!theme?.primary) {
    return undefined;
  }

  const rgb = toRgb(theme.primary);
  if (!rgb) {
    return undefined;
  }

  const lum = calculateRelativeLuminance(rgb.r, rgb.g, rgb.b);
  const foreground = lum > 0.4 ? '#0a0a0a' : '#fafafa';

  return {
    '--primary': theme.primary,
    '--primary-foreground': foreground,
    '--ring': theme.primary,
  } as React.CSSProperties;
}
