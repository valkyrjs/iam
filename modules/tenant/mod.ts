import { getMetaDirname, getRoutes } from "@platform/server";

export * from "./data/methods.ts";
export * from "./data/tenant.ts";
export * from "./data/tenant-principal.ts";

export default {
  routes: () => getRoutes(getMetaDirname(import.meta)),
};
