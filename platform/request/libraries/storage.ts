import { AsyncLocalStorage } from "node:async_hooks";

export const storage = new AsyncLocalStorage<RequestStorage>();

// biome-ignore lint/suspicious/noEmptyInterface: extended by other entities
export interface RequestStorage {}
