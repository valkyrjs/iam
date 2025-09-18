/**
 * @module
 *
 * This module contains authorization and access control tooling.
 *
 * @example
 * ```ts
 * import { readFile } from "node:fs/promises";
 * import { join } from "node:path";
 * import { Database } from "@db/sqlite";
 *
 * import { SQLiteAuth } from "@valkyr/auth/sqlite";
 * import { ActionFilter, type Permissions } from "@valkyr/auth";
 *
 * export const auth = new Auth({
 *   auth: {
 *     algorithm: "RS256",
 *     privateKey: await readFile(join(__dirname, ".keys", "private"), "utf-8"),
 *     publicKey: await readFile(join(__dirname, ".keys", "public"), "utf-8"),
 *     issuer: "https://valkyrjs.com",
 *     audience: "https://valkyrjs.com",
 *   },
 *   session: z.object({
 *     accountId: z.string(),
 *   }),
 *   permissions: {
 *     account: ["create", "read", "update", "delete"],
 *   } as const,
 *   guards: {
 *     "account:manager": new AccessGuard({
 *       input: z.object({ accountId: z.string() }),
 *       check: async ({ accountId }, session) => {
 *         return db
 *           .getManagedAccounts(session.accountId)
 *           .then((accountIds) => accountIds.includes(accountId))
 *       },
 *     }),
 *   }
 * });
 * ```
 */

import {
  importPKCS8,
  importSPKI,
  type JWTHeaderParameters,
  type JWTPayload,
  jwtVerify,
  type KeyObject,
  SignJWT,
} from "jose";
import { JOSEError } from "jose/errors";

import type {
  AccessControlProvider,
  AnyAccessControlProvider,
} from "./access.ts";
import type { AnyPrincipal, AnyPrincipalProvider } from "./principal.ts";
import type { AnyResourceRegistry } from "./resources.ts";

/**
 * Provides a solution to manage user authentication and access control rights within an
 * application.
 */
export class Auth<
  TPrincipalProvider extends AnyPrincipalProvider,
  TResourceRegistry extends AnyResourceRegistry,
  TAccessControlProvider extends AccessControlProvider<
    TPrincipalProvider["$principal"]
  >,
> {
  #secret?: KeyObject;
  #pubkey?: KeyObject;

  declare $principal: TPrincipalProvider["$principal"];
  declare $resources: TResourceRegistry["$resource"][];
  declare $access: TAccessControlProvider;

  constructor(
    readonly config: Config<
      TPrincipalProvider,
      TResourceRegistry,
      TAccessControlProvider
    >,
  ) {}

  /*
   |--------------------------------------------------------------------------------
   | Accessors
   |--------------------------------------------------------------------------------
   */

  /**
   * Secret key used to sign new tokens.
   */
  get secret(): Promise<KeyObject> {
    return new Promise((resolve) => {
      if (this.#secret === undefined) {
        importPKCS8(
          this.config.settings.privateKey,
          this.config.settings.algorithm,
        ).then((key) => {
          this.#secret = key;
          resolve(key);
        });
      } else {
        resolve(this.#secret);
      }
    });
  }

  /**
   * Public key used to verify tokens.
   */
  get pubkey(): Promise<KeyObject> {
    return new Promise<KeyObject>((resolve) => {
      if (this.#pubkey === undefined) {
        importSPKI(
          this.config.settings.publicKey,
          this.config.settings.algorithm,
        ).then((key) => {
          this.#pubkey = key;
          resolve(key);
        });
      } else {
        resolve(this.#pubkey);
      }
    });
  }

  /*
   |--------------------------------------------------------------------------------
   | Session Utilities
   |--------------------------------------------------------------------------------
   */

  /**
   * Generates a new access token from the given tenant and entity ids.
   *
   * - If **expiration** is a `number` is passed as an argument it is used as the
   *   claim directly.
   * - If **expiration** is a `Date` instance is passed as an argument it is
   *   converted to unix timestamp and used as the claim.
   * - If **expiration** is a `string` is passed as an argument it is resolved to a
   *   time span, and then added to the current unix timestamp and used as the
   *   claim.
   *
   * Format used for time span should be a number followed by a unit, such as
   * "5 minutes" or "1 day".
   *
   * Valid units are: "sec", "secs", "second", "seconds", "s", "minute", "minutes",
   * "min", "mins", "m", "hour", "hours", "hr", "hrs", "h", "day", "days", "d",
   * "week", "weeks", "w", "year", "years", "yr", "yrs", and "y". It is not
   * possible to specify months. 365.25 days is used as an alias for a year.
   *
   * If the string is suffixed with "ago", or prefixed with a "-", the resulting
   * time span gets subtracted from the current unix timestamp. A "from now" suffix
   * can also be used for readability when adding to the current unix timestamp.
   *
   * @param payload    - Payload to sign.
   * @param expiration - Expiration date of the token. Default: 1 hour
   */
  async generate(
    payload: { uid: string },
    expiration: string | number | Date = "1 hour",
  ): Promise<string> {
    return new SignJWT(payload)
      .setProtectedHeader({ alg: this.config.settings.algorithm })
      .setIssuedAt()
      .setIssuer(this.config.settings.issuer)
      .setAudience(this.config.settings.audience)
      .setExpirationTime(expiration)
      .sign(await this.secret);
  }

  /**
   * Verifies the given JWT token using the public key, then returns a session
   * resolution.
   *
   * @param token - Token to resolve auth session from.
   */
  async resolve(
    token: string,
  ): Promise<SessionResolution<this["$principal"], TAccessControlProvider>> {
    try {
      const { payload, protectedHeader } = await jwtVerify<unknown>(
        token,
        await this.pubkey,
        {
          issuer: this.config.settings.issuer,
          audience: this.config.settings.audience,
        },
      );

      const principal = await this.config.principal.resolve(
        payload.uid as string,
      );
      if (principal === undefined) {
        throw new Error("Principal Not Found");
      }

      return {
        valid: true,
        principal,
        access: this.config.access(principal),
        $meta: {
          headers: protectedHeader,
          payload,
        },
        toJSON() {
          return { uid: payload.uid as string };
        },
      };
    } catch (error) {
      if (error instanceof JOSEError) {
        return {
          valid: false,
          code: error.code,
          message: error.message,
        };
      }
      return {
        valid: false,
        code: "AUTH_INTERNAL_ERROR",
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

type Config<
  TPrincipalProvider extends AnyPrincipalProvider,
  TResourceRegistry extends AnyResourceRegistry,
  TAccessControlProvider extends AnyAccessControlProvider,
> = {
  principal: TPrincipalProvider;
  resources: TResourceRegistry;
  access: TAccessControlProvider;
  settings: {
    algorithm: string;
    privateKey: string;
    publicKey: string;
    issuer: string;
    audience: string;
  };
};

export type ResolvedSession<TAuth extends AnyAuth> = Extract<
  SessionResolution<TAuth["$principal"], TAuth["$access"]>,
  { valid: true }
>;

export type SessionResolution<
  TPrincipal extends AnyPrincipal,
  TAccessControlProvider extends AccessControlProvider<TPrincipal>,
> =
  | ({
      valid: true;
    } & {
      principal: TPrincipal;
    } & {
      access: ReturnType<TAccessControlProvider>;
    } & {
      $meta: {
        headers: JWTHeaderParameters;
        payload: JWTPayload;
      };
    } & {
      toJSON(): { uid: string };
    })
  | {
      valid: false;
      code: string;
      message: string;
    };

type AnyAuth = Auth<
  AnyPrincipalProvider,
  AnyResourceRegistry,
  AnyAccessControlProvider
>;
