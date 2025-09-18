import type { AnyPrincipal } from "./principal.ts";

/**
 * Represents any access control provider function.
 *
 * This is a convenience alias for situations where the specific principal
 * type is not known or when working with heterogeneous collections of
 * access control providers.
 */
export type AnyAccessControlProvider = AccessControlProvider<AnyPrincipal>;

/**
 * A function that produces an access control instance for a given principal.
 *
 * Access control providers encapsulate authorization logic, returning an
 * object that can evaluate permissions for the given principal across
 * one or more resources.
 *
 * @template TPrincipal - The type of principal for which this access control
 *                         provider evaluates permissions. Typically extends `AnyPrincipal`.
 *
 * @param principal - The principal whose permissions will be evaluated.
 *
 * @returns Instance containing methods for permission checks. The instance type is defined
 *          by the implementer.
 *
 * @example
 * import type { Principal } from "./principal.ts";
 * import type { Resource } from "./resources.ts";
 *
 * const provider: AccessControlProvider<Principal> = (principal) => {
 *   return {
 *     isAllowed(resource: Resource, actions: string[]) {
 *       return principal.roles.includes("admin");
 *     },
 *   };
 * };
 *
 * const principal: Principal = { uid: "123", roles: ["user"], attributes: {} };
 * const access = provider(principal);
 * access.isAllowed({ kind: "post", id: "456", attributes: {} }, ["read"]); // => false
 */
export type AccessControlProvider<TPrincipal extends AnyPrincipal> = (
  principal: TPrincipal,
) => any;
