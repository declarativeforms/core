import type { IDeclarativeFormTheme } from '@declarativeforms/engine';

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
  theme: IDeclarativeFormTheme | undefined,
): Record<'--primary' | '--primary-foreground' | '--ring', string> | undefined {
  if (!theme?.primary) {
    return undefined;
  }

  const rgb = toRgb(theme.primary);

  if (!rgb) {
    return undefined;
  }

  const lum = calculateRelativeLuminance(rgb.r, rgb.g, rgb.b);
  const foreground = lum > 0.179 ? '#000000' : '#ffffff';

  return {
    '--primary': `#${theme.primary.replace(/^#/, '')}`,
    '--primary-foreground': foreground,
    '--ring': `#${theme.primary.replace(/^#/, '')}`,
  };
}

export function applyFormTheme(
  theme: IDeclarativeFormTheme | undefined,
): () => void {
  const previousMode = document.documentElement.getAttribute('data-form-theme');
  const overrides = buildThemeStyle(theme);
  const previousStyles = Object.keys(overrides ?? {}).map((property) => [
    property,
    document.documentElement.style.getPropertyValue(property),
    document.documentElement.style.getPropertyPriority(property),
  ]);
  const preference =
    theme?.mode === 'auto'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : undefined;

  function updateAppearance(): void {
    document.documentElement.setAttribute(
      'data-form-theme',
      theme?.mode === 'dark' || preference?.matches ? 'dark' : 'light',
    );
  }

  updateAppearance();

  for (const [property, value] of Object.entries(overrides ?? {})) {
    document.documentElement.style.setProperty(property, value);
  }

  preference?.addEventListener('change', updateAppearance);

  return () => {
    preference?.removeEventListener('change', updateAppearance);

    if (previousMode === null) {
      document.documentElement.removeAttribute('data-form-theme');
    } else {
      document.documentElement.setAttribute('data-form-theme', previousMode);
    }

    for (const [property, value, priority] of previousStyles) {
      if (value) {
        document.documentElement.style.setProperty(property, value, priority);
      } else {
        document.documentElement.style.removeProperty(property);
      }
    }
  };
}
