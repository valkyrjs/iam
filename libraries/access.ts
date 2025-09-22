import type { AnyPrincipal } from "./principal.ts";
import type { AnyResource } from "./resources.ts";

/**
 * A factory type that produces access control methods for a set of resources and actions.
 *
 * Access factories encapsulate the logic for evaluating whether a principal
 * (user or system identity) is allowed to perform specific actions on
 * resources. They provide methods to check individual resources or multiple
 * resources at once.
 *
 * @template TResource - The set of resources that can be checked. Typically extends `AnyResource`.
 * @template TAction   - Defines the actions allowed on each resource type.
 *
 * @example
 * import type { PrincipalAccessControl } from "@valkyr/auth";
 *
 * import type { Resource, Action } from "./resources.ts";
 * import type { Principal } from "./principal.ts";
 *
 * export function createPrincipalAccess(principal: Principal) {
 *   return {
 *     isAllowed(resource, action) {
 *       if (action !== "read") {
 *         return false;
 *       }
 *       return principal.attributes.tenantId === resource.attr.tenantId;
 *     },
 *
 *     checkResource(resource, actions) {
 *       return {
 *         kind: resource.kind,
 *         id: resource.id,
 *         actions,
 *       };
 *     },
 *
 *     checkResources(resources) {
 *       return resources.map(({ resource, actions }) => ({
 *         kind: resource.kind,
 *         id: resource.id,
 *         actions,
 *       }));
 *     },
 *   } satisfies PrincipalAccessControl<Resource, Action>;
 * }
 *
 * const access = createPrincipalAccess(principal);
 *
 * // Check if the principal is allowed to perform an action on a resource
 * access.isAllowed({ kind: "user", id: "1", attr: { tenantId: "abc", public: true } }, "read");
 *
 * // Check a single resource and record allowed actions
 * access.checkResource({ kind: "user", id: "1", attr: { tenantId: "abc", public: true } }, ["read", "update"]);
 *
 * // Check multiple resources at once
 * access.checkResources([
 *   { resource: { kind: "user", id: "1", attr: { tenantId: "abc", public: true } }, actions: ["read"] },
 *   { resource: { kind: "post", id: "2", attr: { tenantId: "abc", owner: "1" } }, actions: ["update"] },
 * ]);
 */
export type PrincipalAccessControl<
  TResource extends AnyResource,
  TAction extends { kind: TResource["kind"]; actions: any[] },
> = {
  isAllowed<TKind extends TResource["kind"]>(
    resource: Extract<TResource, { kind: TKind }>,
    action: Extract<TAction, { kind: TKind }>["actions"][number],
  ): boolean;

  checkResource<TKind extends TResource["kind"]>(
    resource: Extract<TResource, { kind: TKind }>,
    actions: Extract<TAction, { kind: TKind }>["actions"][number][],
  ): any;

  checkResources<
    TKind extends TResource["kind"],
    TResources extends {
      resource: Extract<TResource, { kind: TKind }>;
      actions: Extract<TAction, { kind: TKind }>["actions"][number][];
    }[],
  >(
    resources: TResources,
  ): any;
} & {
  [method: string]: any;
};

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
 * const principal: Principal = { id: "123", roles: ["user"], attributes: {} };
 * const access = provider(principal);
 * access.isAllowed({ kind: "post", id: "456", attributes: {} }, ["read"]); // => false
 */
export type AccessControlProvider<TPrincipal extends AnyPrincipal> = (
  principal: TPrincipal,
) => any;
