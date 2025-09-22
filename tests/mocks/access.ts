import type { PrincipalAccessControl } from "../../libraries/access.ts";
import type { Principal } from "./principal.ts";
import type { Action, Resource } from "./resources.ts";

export function access(principal: Principal) {
  return {
    isAllowed(resource, action) {
      if (action !== "read") {
        return false;
      }
      return principal.attributes.tenantId === resource.attr.tenantId;
    },

    checkResource(resource, actions) {
      return {
        kind: resource.kind,
        id: resource.id,
        actions,
      };
    },

    checkResources(resources) {
      return resources.map(({ resource, actions }) => ({
        kind: resource.kind,
        id: resource.id,
        actions,
      }));
    },
  } satisfies PrincipalAccessControl<Resource, Action>;
}

/*

*/
