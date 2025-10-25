import { rgbToAnsi256 } from "./rgb.ts";

/**
 * Convert provided hex value to closest 256-Color value.
 *
 * @param hex - Hex to convert.
 */
export function hexToAnsi256(hex: HexValue) {
  const { r, g, b } = hexToRGB(hex);
  return rgbToAnsi256(r, g, b);
}

/**
 * Take a hex value and return its RGB values.
 *
 * @param hex - Hex to convert to RGB
 * @returns
 */
export function hexToRGB(hex: HexValue): { r: number; g: number; b: number } {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

export type HexValue =
  `#${string | number}${string | number}${string | number}${string | number}${string | number}${string | number}`;
