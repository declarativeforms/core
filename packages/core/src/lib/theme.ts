type ThemeOverrides = {
  primary?: string;
};

/**
 * Parse a hex color string into RGB components (0-255).
 * Supports 3-digit (#RGB) and 6-digit (#RRGGBB) hex.
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace("#", "");

  if (cleaned.length === 3) {
    return {
      r: parseInt(cleaned[0] + cleaned[0], 16),
      g: parseInt(cleaned[1] + cleaned[1], 16),
      b: parseInt(cleaned[2] + cleaned[2], 16),
    };
  }

  if (cleaned.length === 6) {
    return {
      r: parseInt(cleaned.slice(0, 2), 16),
      g: parseInt(cleaned.slice(2, 4), 16),
      b: parseInt(cleaned.slice(4, 6), 16),
    };
  }

  return null;
}

/**
 * Returns relative luminance of a color (0 = black, 1 = white).
 * Uses the sRGB linearization formula from WCAG 2.x.
 */
function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Build a CSS custom property map from a theme object.
 * Returns a React-compatible style object to spread onto a container element.
 */
export function buildThemeStyle(
  theme: ThemeOverrides | undefined
): React.CSSProperties | undefined {
  if (!theme?.primary) {
    return undefined;
  }

  const rgb = hexToRgb(theme.primary);
  if (!rgb) {
    return undefined;
  }

  const lum = relativeLuminance(rgb.r, rgb.g, rgb.b);
  const foreground = lum > 0.4 ? "#0a0a0a" : "#fafafa";

  return {
    "--primary": theme.primary,
    "--primary-foreground": foreground,
    "--ring": theme.primary,
  } as React.CSSProperties;
}
