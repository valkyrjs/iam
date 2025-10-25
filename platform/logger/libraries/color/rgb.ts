/**
 * Convert RGB to the nearest 256-color ANSI value
 *
 * @param r - Red value.
 * @param g - Green value.
 * @param b - Blue value.
 */
export function rgbToAnsi256(r: number, g: number, b: number): number {
  if (r === g && g === b) {
    if (r < 8) return 16;
    if (r > 248) return 231;
    return Math.round(((r - 8) / 247) * 24) + 232;
  }

  // Map RGB to 6×6×6 color cube (16–231)
  const conv = (val: number) => Math.round(val / 51);
  const ri = conv(r);
  const gi = conv(g);
  const bi = conv(b);

  return 16 + 36 * ri + 6 * gi + bi;
}

export type RGB = { r: number; g: number; b: number };
