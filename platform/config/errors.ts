import { SERVICE_ENV } from "./service.ts";

/**
 * Error thrown when an invalid `SERVICE_ENV` value is provided.
 *
 * This occurs when the resolved service environment variable does not match
 * one of the allowed values in {@link SERVICE_ENV}.
 *
 * @extends Error
 */
export class InvalidServiceEnvironmentError extends Error {
  /**
   * A stable error code for identifying this type of error.
   *
   * @readonly
   */
  readonly code = "INVALID_SERVICE_ENVIRONMENT";

  /**
   * Create a new InvalidServiceEnvironmentError.
   *
   * @param value - The invalid service environment value.
   */
  constructor(value: string) {
    super(
      `@platform/config requested invalid service environment, expected '${SERVICE_ENV.join(", ")}' got '${value}'.`,
    );
  }
}

/**
 * Error thrown when an invalid environment key is accessed or provided.
 *
 * This can happen when attempting to resolve a `.env` configuration key that
 * does not exist or is malformed.
 *
 * @extends Error
 */
export class InvalidEnvironmentKeyError<TDetails = unknown> extends Error {
  /**
   * A stable error code for identifying this type of error.
   *
   * @readonly
   */
  readonly code = "INVALID_ENVIRONMENT_KEY";

  /**
   * Extra details related to the invalid key (may be validation context,
   * original error object, or any metadata supplied by the caller).
   *
   * @readonly
   */
  readonly details: TDetails;

  /**
   * Create a new InvalidEnvironmentKeyError.
   *
   * @param key     - The invalid environment key name.
   * @param details - Additional details about the error.
   */
  constructor(key: string, details: TDetails) {
    super(`@platform/config invalid environment key '${key}' provided.`);
    this.details = details;
  }
}
