import type { Principal } from "./principal.ts";

export function access(principal: Principal) {
  return {
    isAllowed(tenantId: string): boolean {
      return principal.attributes.tenantId === tenantId;
    },
  };
}
