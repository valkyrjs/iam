import { Route } from "@platform/relay";

/**
 * Traverse given path and find any 'handler.ts' files which are registered
 * as route handler instances.
 *
 * @param path   - Base path to traverse.
 * @param routes - List to push routes to.
 *
 * @example
 * ```ts
 * import { getRoutes } from "@platform/server";
 *
 * const routes = await getRoutes("./routes");
 * ```
 */
export async function getRoutes(path: string, routes: Route[] = []): Promise<Route[]> {
  for await (const entity of Deno.readDir(path)) {
    if (entity.isDirectory === true) {
      await getRoutes(`${path}/${entity.name}`, routes);
    }
    if (entity.name === "handler.ts") {
      const { default: route } = await import(`${path}/${entity.name}`);
      if (route instanceof Route === true) {
        routes.push(route);
      }
    }
  }
  return routes;
}

/**
 * Gets a guaranteed meta dirname value.
 *
 * @param meta - Import meta object to retrieve dirname from.
 *
 * @throws new Error("Failed to retrieve dirname from import.meta") if no dirname is
 *         present on the meta object.
 *
 * @example
 * ```ts
 * import { getMetaDirname } from "@platform/server";
 *
 * const dirname = getMetaDirname(import.meta);
 * ```
 */
export function getMetaDirname(meta: ImportMeta): string {
  if (meta.dirname === undefined) {
    throw new Error("Failed to retrieve dirname from import.meta");
  }
  return meta.dirname;
}
