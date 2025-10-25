// biome-ignore lint/suspicious/noEmptyInterface: extended by external entities
export interface RequestContext {}

export function mergeContexts(...contexts: object[]) {
  const merged = {};
  for (const ctx of contexts) {
    Object.defineProperties(merged, Object.getOwnPropertyDescriptors(ctx));
  }
  return merged;
}
