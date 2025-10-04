export function toEscapeSequence(value: string | number): `\x1b[${string}m` {
  return `\x1b[${value}m`;
}
