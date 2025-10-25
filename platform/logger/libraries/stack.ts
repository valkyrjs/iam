/**
 * Fetch the most closest relevant error from the local code base so it can
 * be more easily traced to its source.
 *
 * @param stack  - Error stack.
 * @param search - Relevant stack line search value.
 */
export function getTracedAt(stack: string | undefined, search: string): string | undefined {
  if (stack === undefined) {
    return undefined;
  }
  const firstMatch = stack.split("\n").find((line) => line.includes(search));
  if (firstMatch === undefined) {
    return undefined;
  }
  return firstMatch
    .replace(/^.*?(file:\/\/\/)/, "$1")
    .replace(/\)$/, "")
    .trim();
}
