import { load } from "@std/dotenv";
import type { ZodType, z } from "zod";

import { InvalidEnvironmentKeyError } from "./errors.ts";
import { getServiceEnvironment, type ServiceEnvironment } from "./service.ts";

const env = await load();

/**
 * TODO ...
 */
export function getEnvironmentVariable<TType extends ZodType>({
  key,
  type,
  envFallback,
  fallback,
}: {
  key: string;
  type: TType;
  envFallback?: EnvironmentFallback;
  fallback?: string;
}): z.infer<TType> {
  const serviceEnv = getServiceEnvironment();
  const providedValue = env[key] ?? Deno.env.get(key);
  const fallbackValue = typeof envFallback === "object" ? (envFallback[serviceEnv] ?? fallback) : fallback;
  const toBeUsed = providedValue ?? fallbackValue;
  try {
    if (typeof toBeUsed === "string" && (toBeUsed.trim().startsWith("{") || toBeUsed.trim().startsWith("["))) {
      return type.parse(JSON.parse(toBeUsed));
    }
    return type.parse(toBeUsed);
  } catch (error) {
    throw new InvalidEnvironmentKeyError(key, {
      cause: error,
    });
  }
}

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

type EnvironmentFallback = Partial<Record<ServiceEnvironment, string>> & {
  testing?: string;
  local?: string;
  stg?: string;
  demo?: string;
  prod?: string;
};
