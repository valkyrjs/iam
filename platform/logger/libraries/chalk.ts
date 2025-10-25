import type { HexValue } from "./color/hex.ts";
import { type BGColor, type Color, hexToBgColor, hexToColor, type Modifier, styles } from "./color/styles.ts";

export const chalk = {
  color(hex: HexValue): (value: string) => string {
    const color = hexToColor(hex);
    return (value: string) => `${color}${value}${styles.modifier.reset}`;
  },
  bgColor(hex: HexValue): (value: string) => string {
    const color = hexToBgColor(hex);
    return (value: string) => `${color}${value}${styles.modifier.reset}`;
  },
} as Chalk;

for (const key in styles.modifier) {
  chalk[key as Modifier] = (value: string) => toModifiedValue(key as Modifier, value);
}

for (const key in styles.color) {
  chalk[key as Color] = (value: string) => toColorValue(key as Color, value);
}

for (const key in styles.bgColor) {
  chalk[key as BGColor] = (value: string) => toBGColorValue(key as BGColor, value);
}

function toModifiedValue(key: Modifier, value: string): string {
  return `${styles.modifier[key]}${value}${styles.modifier.reset}`;
}

function toColorValue(key: Color, value: string): string {
  return `${styles.color[key]}${value}${styles.modifier.reset}`;
}

function toBGColorValue(key: BGColor, value: string): string {
  return `${styles.bgColor[key]}${value}${styles.modifier.reset}`;
}

type Chalk = Record<Modifier | Color | BGColor, (value: string) => string> & {
  color(hex: HexValue): (value: string) => string;
  bgColor(hex: HexValue): (value: string) => string;
};
