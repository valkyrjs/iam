import { getMetaDirname, getRoutes } from "@platform/server";

export * from "./repositories/tenant.ts";
export * from "./repositories/tenant-invite.ts";
export * from "./repositories/tenant-principal.ts";
export * from "./schemas/tenant.ts";
export * from "./schemas/tenant-invite.ts";
export * from "./schemas/tenant-principal.ts";

/*
 |--------------------------------------------------------------------------------
 | Module
 |--------------------------------------------------------------------------------
 */

export default {
  routes: () => getRoutes(getMetaDirname(import.meta)),
};
