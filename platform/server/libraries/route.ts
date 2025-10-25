import { logger } from "@platform/logger";
import { Route, type RouteMethod } from "@platform/relay";

const SUPPORTED_MEHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const log = logger.prefix("API");

export class RouteRegistry {
  readonly #index = new Map<string, Route>();

  /**
   * Route maps funneling registered routes to the specific methods supported by
   * the relay instance.
   */
  readonly routes: Routes = {
    POST: [],
    GET: [],
    PUT: [],
    PATCH: [],
    DELETE: [],
  };

  /**
   * List of paths in the '${method} ${path}' format allowing us to quickly throw
   * errors if a duplicate route path is being added.
   */
  readonly #paths = new Set<string>();

  /**
   * Instantiate a new Api instance.
   *
   * @param routes - Initial list of routes to register with the api.
   */
  constructor(routes: Route[] = []) {
    this.register(routes);
  }

  /**
   * Register relays with the API instance allowing for decoupled registration
   * of server side handling of relay contracts.
   *
   * @param routes - Relays to register with the instance.
   */
  register(routes: Route[]): this {
    const methods: (keyof typeof this.routes)[] = [];
    for (const route of routes) {
      const path = `${route.method} ${route.path}`;
      if (this.#paths.has(path)) {
        throw new Error(`Router > Path ${path} already exists`);
      }
      this.#paths.add(path);
      this.routes[route.method].push(route);
      methods.push(route.method);
      this.#index.set(`${route.method} ${route.path}`, route);
      log.info(`Registered ${route.method} ${route.path}`);
    }
    for (const method of methods) {
      this.routes[method].sort(byStaticPriority);
    }
    return this;
  }

  /**
   * Attempt to resolve a route based on the given method and pathname.
   *
   * @param method - HTTP method.
   * @param url    - HTTP request url.
   */
  getRoute(method: string, url: string): ResolvedRoute {
    assertMethod(method);
    for (const route of this.routes[method]) {
      if (route.match(url) === true) {
        return { route, params: route.getParsedParams(url) };
      }
    }
    return { params: {} };
  }
}

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

/*
 |--------------------------------------------------------------------------------
 | Helpers
 |--------------------------------------------------------------------------------
 */

/**
 * Assert that the given method string is a valid routing method.
 *
 * @param candidate - Method candidate.
 */
function assertMethod(candidate: string): asserts candidate is RouteMethod {
  if (!SUPPORTED_MEHODS.includes(candidate)) {
    throw new Error(`Router > Unsupported method '${candidate}'`);
  }
}

/**
 * Sorting method for routes to ensure that static properties takes precedence
 * for when a route is matched against incoming requests.
 *
 * @param a - Route A
 * @param b - Route B
 */
function byStaticPriority(a: Route, b: Route) {
  const aSegments = a.path.split("/");
  const bSegments = b.path.split("/");

  const maxLength = Math.max(aSegments.length, bSegments.length);

  for (let i = 0; i < maxLength; i++) {
    const aSegment = aSegments[i] || "";
    const bSegment = bSegments[i] || "";

    const isADynamic = aSegment.startsWith(":");
    const isBDynamic = bSegment.startsWith(":");

    if (isADynamic !== isBDynamic) {
      return isADynamic ? 1 : -1;
    }

    if (isADynamic === false && aSegment !== bSegment) {
      return aSegment.localeCompare(bSegment);
    }
  }

  return a.path.localeCompare(b.path);
}

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

type Routes = Record<RouteMethod, Route[]>;

type ResolvedRoute = {
  route?: Route;
  params: any;
};
