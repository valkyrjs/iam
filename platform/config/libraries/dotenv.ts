import { load } from "@std/dotenv";

const env = await load();

/**
 * TODO ...
 */
export function getDotEnvVariable(key: string): string {
  return env[key] ?? Deno.env.get(key);
}
