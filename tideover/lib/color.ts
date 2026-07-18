/**
 * WCAG 2.1 contrast utilities. Pure, dependency-free, unit-tested.
 *
 * Why this exists: the status surfaces tint UI with the merchant's stored brand
 * color (`brand.colors.primary`). A LIGHT brand color used as TEXT or a thin
 * edge on the sand/paper background can silently fail WCAG AA (4.5:1) — it looks
 * fine on the dark demo teal but would wash out for a merchant whose brand is,
 * say, a pale gold. `ensureReadable` darkens the *rendered* accent (never the
 * stored brand color) just enough to clear the ratio, so accent text/edges stay
 * legible for every merchant without hand-tuning. Large fills/tints keep the raw
 * brand color — contrast rules only bind on text and thin edges.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Parse "#rgb" / "#rrggbb" (with or without the leading #) → 0–255 channels. */
export function parseHex(hex: string): Rgb {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) {
    throw new Error(`invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/** Serialize channels back to a canonical lowercase #rrggbb. */
export function toHex({ r, g, b }: Rgb): string {
  const c = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

function linearize(channel8: number): number {
  const c = channel8 / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance: 0 (black) … 1 (white). */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/** WCAG contrast ratio between two colors: 1 (identical) … 21 (black on white). */
export function contrastRatio(hexA: string, hexB: string): number {
  const la = relativeLuminance(hexA);
  const lb = relativeLuminance(hexB);
  const light = Math.max(la, lb);
  const dark = Math.min(la, lb);
  return (light + 0.05) / (dark + 0.05);
}

/** The warm page background (sand token) the status surfaces render on. */
export const SURFACE_BG = "#FBF8F2";

/**
 * Darken `accent` until it meets `min` contrast against `backgroundHex`; return
 * it unchanged (normalized) when it already passes. On a LIGHT background,
 * darkening monotonically raises contrast, so this always converges — worst case
 * is #000000 (21:1 on white). Never mutates the merchant's stored color: the
 * caller uses the result only for rendered text/edges.
 */
export function ensureReadable(
  accent: string,
  backgroundHex: string = SURFACE_BG,
  min = 4.5,
): string {
  let { r, g, b } = parseHex(accent);
  if (contrastRatio(toHex({ r, g, b }), backgroundHex) >= min) {
    return toHex({ r, g, b });
  }
  // Step each channel toward black. floor(x * 0.92) strictly decreases every
  // channel while x >= 1, so the loop is guaranteed to terminate at #000000.
  for (let i = 0; i < 64; i++) {
    r = Math.floor(r * 0.92);
    g = Math.floor(g * 0.92);
    b = Math.floor(b * 0.92);
    const hex = toHex({ r, g, b });
    if (contrastRatio(hex, backgroundHex) >= min) return hex;
    if (r === 0 && g === 0 && b === 0) break;
  }
  return "#000000";
}

/**
 * The merchant accent made AA-readable on the status surface background. This is
 * the render-path entry point: it must NEVER throw, because it runs on the public
 * customer status page. Brand colors are hex today, but if onboarding ever admits
 * a non-hex value, degrade gracefully to the raw accent rather than crash the page.
 */
export function readableAccent(accent: string, min = 4.5): string {
  try {
    return ensureReadable(accent, SURFACE_BG, min);
  } catch {
    return accent;
  }
}
