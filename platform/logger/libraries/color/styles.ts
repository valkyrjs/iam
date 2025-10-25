import { type HexValue, hexToAnsi256 } from "./hex.ts";
import { toEscapeSequence } from "./utilities.ts";

export const styles = {
  modifier: {
    reset: toEscapeSequence(0), // Reset to normal
    bold: toEscapeSequence(1), // Bold text
    dim: toEscapeSequence(2), // Dim text
    italic: toEscapeSequence(3), // Italic text
    underline: toEscapeSequence(4), // Underlined text
    overline: toEscapeSequence(53), // Overline text
    inverse: toEscapeSequence(7), // Inverse
    hidden: toEscapeSequence(8), // Hidden text
    strikethrough: toEscapeSequence(9), // Strikethrough
  },

  color: {
    black: toEscapeSequence(30), // Black color
    red: toEscapeSequence(31), // Red color
    green: toEscapeSequence(32), // Green color
    yellow: toEscapeSequence(33), // Yellow color
    blue: toEscapeSequence(34), // Blue color
    magenta: toEscapeSequence(35), // Magenta color
    cyan: toEscapeSequence(36), // Cyan color
    white: toEscapeSequence(37), // White color
    orange: hexToColor("#FFA500"),

    // Bright colors
    blackBright: toEscapeSequence(90),
    gray: toEscapeSequence(90), // Alias for blackBright
    grey: toEscapeSequence(90), // Alias for blackBright
    redBright: toEscapeSequence(91),
    greenBright: toEscapeSequence(92),
    yellowBright: toEscapeSequence(93),
    blueBright: toEscapeSequence(94),
    magentaBright: toEscapeSequence(95),
    cyanBright: toEscapeSequence(96),
    whiteBright: toEscapeSequence(97),
  },

  bgColor: {
    bgBlack: toEscapeSequence(40),
    bgRed: toEscapeSequence(41),
    bgGreen: toEscapeSequence(42),
    bgYellow: toEscapeSequence(43),
    bgBlue: toEscapeSequence(44),
    bgMagenta: toEscapeSequence(45),
    bgCyan: toEscapeSequence(46),
    bgWhite: toEscapeSequence(47),
    bgOrange: hexToBgColor("#FFA500"),

    // Bright background colors
    bgBlackBright: toEscapeSequence(100),
    bgGray: toEscapeSequence(100), // Alias for bgBlackBright
    bgGrey: toEscapeSequence(100), // Alias for bgBlackBright
    bgRedBright: toEscapeSequence(101),
    bgGreenBright: toEscapeSequence(102),
    bgYellowBright: toEscapeSequence(103),
    bgBlueBright: toEscapeSequence(104),
    bgMagentaBright: toEscapeSequence(105),
    bgCyanBright: toEscapeSequence(106),
    bgWhiteBright: toEscapeSequence(107),
  },
};

export function hexToColor(hex: HexValue): string {
  return toEscapeSequence(`38;5;${hexToAnsi256(hex)}`); // Foreground color
}

export function hexToBgColor(hex: HexValue): string {
  return toEscapeSequence(`48;5;${hexToAnsi256(hex)}`); // Background color
}

export type Modifier = keyof typeof styles.modifier;
export type Color = keyof typeof styles.color;
export type BGColor = keyof typeof styles.bgColor;
