import { Route } from "@platform/relay";

/**
 * Resolve and return all routes that has been created under any 'routes'
 * folders that can be found under the given path.
 *
 * If the filter is empty, all paths are resolved, otherwise only paths
 * declared in the array is resolved.
 *
 * @param path   - Path to resolve routes from.
 * @param filter - List of modules to include.
 * @param routes - List of routes that has been resolved.
 */
export async function resolveRoutes(path: string, routes: Route[] = []): Promise<Route[]> {
  for await (const entry of Deno.readDir(path)) {
    if (entry.isDirectory === true) {
      await loadRoutes(`${path}/${entry.name}`, routes, [name]);
    }
  }
  return routes;
}

async function loadRoutes(path: string, routes: Route[], modules: string[]): Promise<void> {
  for await (const entry of Deno.readDir(path)) {
    if (entry.isDirectory === true) {
      await loadRoutes(`${path}/${entry.name}`, routes, [...modules, entry.name]);
    } else {
      if (!entry.name.endsWith(".ts") || entry.name.endsWith("i9n.ts")) {
        continue;
      }
      const { default: route } = (await import(`${path}/${entry.name}`)) as { default: Route };
      if (route instanceof Route === false) {
        throw new Error(
          `Router Violation: Could not load '${path}/${entry.name}' as it does not export a default Route instance.`,
        );
      }
      routes.push(route);
    }
  }
}
