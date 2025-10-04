import { getDotEnvVariable } from "./dotenv.ts";
import { InvalidServiceEnvironmentError } from "./errors.ts";

/**
 * List of valid service environment names.
 */
export const SERVICE_ENV = ["local", "testing", "feature", "staging", "production"] as const;

/**
 * Get the current service environment for the application.
 *
 * This function attempts to read the environment variable `SERVICE_ENV` from
 * the `.env` configuration. If the variable is not set, `"local"` is returned
 * by default.
 *
 * If the value of `SERVICE_ENV` is set but not one of the allowed values
 * (`"local"`, `"testing"`, `"feature"`, `"staging"`, `"production"`),
 * an {@link InvalidServiceEnvironmentError} is thrown.
 *
 * @returns The resolved service environment.
 */
export function getServiceEnvironment(): ServiceEnvironment {
  const value = getDotEnvVariable("SERVICE_ENV");
  if (value === undefined) {
    return "local";
  }
  if ((SERVICE_ENV as unknown as string[]).includes(value) === false) {
    throw new InvalidServiceEnvironmentError(value);
  }
  return value as ServiceEnvironment;
}

/**
 * Represents the allowed values for the service environment.
 */
export type ServiceEnvironment = (typeof SERVICE_ENV)[number];
