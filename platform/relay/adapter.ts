import z from "zod";

import type { ServerErrorJSON } from "./errors.ts";
import type { RouteMethod } from "./route.ts";

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

const ServerErrorResponseSchema = z.object({
  error: z.object({
    code: z.any(),
    status: z.number(),
    message: z.string(),
    data: z.any().optional(),
  }),
});

/*
 |--------------------------------------------------------------------------------
 | Utilities
 |--------------------------------------------------------------------------------
 */

/**
 * Check if the given candidate is a valid relay error response.
 *
 * @param candidate - Candidate to check.
 */
export function assertServerErrorResponse(candidate: unknown): candidate is ServerErrorJSON {
  return ServerErrorResponseSchema.safeParse(candidate).success;
}

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

export type RelayAdapter = {
  readonly url: string;

  /**
   * Return the full URL from given endpoint.
   *
   * @param endpoint - Endpoint to get url for.
   */
  getUrl(endpoint: string): string;

  /**
   * Send a request to the configured relay url.
   *
   * @param input     - Request input parameters.
   * @param publicKey - Key to encrypt the payload with.
   */
  send(input: RelayInput, publicKey?: string): Promise<RelayResponse>;

  /**
   * Sends a fetch request using the given options and returns a
   * raw response.
   *
   * @param options - Relay request options.
   */
  request(input: RequestInfo | URL, init?: RequestInit): Promise<RelayResponse>;
};

export type RelayInput = {
  method: RouteMethod;
  endpoint: string;
  query?: string;
  body?: Record<string, unknown>;
  headers?: Headers;
};

export type RelayResponse<TData = unknown, TError = unknown> = TData | TError;
