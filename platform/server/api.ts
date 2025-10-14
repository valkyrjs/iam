import { logger } from "@platform/logger";
import {
  BadRequestError,
  context,
  InternalServerError,
  NotFoundError,
  NotImplementedError,
  type Route,
  type RouteMethod,
  ServerError,
  type ServerErrorJSON,
  UnauthorizedError,
  ValidationError,
} from "@platform/relay";

const SUPPORTED_MEHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export class Api {
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
      logger.prefix("API").info(`Registered ${route.method} ${route.path}`);
    }
    for (const method of methods) {
      this.routes[method].sort(byStaticPriority);
    }
    return this;
  }

  /**
   * Executes request and returns a `Response` instance.
   *
   * @param request - REST request to pass to a route handler.
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // ### Route
    // Locate a route matching the incoming request method and path.

    const resolved = this.#getResolvedRoute(request.method, url.pathname);
    if (resolved === undefined) {
      return toResponse(
        new NotFoundError(`Invalid routing path provided for ${request.url}`, {
          method: request.method,
          url: request.url,
        }),
        request,
      );
    }

    // ### Handle
    // Execute request and return a response.

    const response = await this.#getRouteResponse(resolved, request).catch((error) =>
      this.#getErrorResponse(error, request),
    );

    return response;
  }

  /**
   * Attempt to resolve a route based on the given method and pathname.
   *
   * @param method - HTTP method.
   * @param url    - HTTP request url.
   */
  #getResolvedRoute(method: string, url: string): ResolvedRoute | undefined {
    assertMethod(method);
    for (const route of this.routes[method]) {
      if (route.match(url) === true) {
        return { route, params: route.getParsedParams(url) };
      }
    }
  }

  /**
   * Resolve the request on the given route and return a `Response` instance.
   *
   * @param resolved - Route and paramter details resolved for the request.
   * @param request  - Request instance to resolve.
   */
  async #getRouteResponse({ route, params }: ResolvedRoute, request: Request): Promise<Response> {
    const url = new URL(request.url);

    // ### Args
    // Arguments is passed to every route handler and provides a suite of functionality
    // and request data.

    const args: any[] = [];

    // ### Input
    // Generate route input which contains a map fo params, query, and/or body. If
    // none of these are present then the input is not added to the final argument
    // context of the handler.

    const input: {
      params?: object;
      query?: object;
      body?: unknown;
    } = {
      params: undefined,
      query: undefined,
      body: undefined,
    };

    // ### Access
    // Check the access requirements of the route and run any additional checks
    // if nessesary before proceeding with further request handling.
    //   1. All routes needs access assignment, else we consider it an internal error.
    //   2. If access requires a session we throw Unauthorized if the request is not authenticated.
    //   3. If access is an array of access resources, we check that each resources can be
    //      accessed by the request.

    if (route.state.access === undefined) {
      return toResponse(
        new InternalServerError(`Route '${route.method} ${route.path}' is missing access assignment.`),
        request,
      );
    }

    if (route.state.access !== "public" && context.isAuthenticated === false) {
      return toResponse(new UnauthorizedError(), request);
    }

    // ### Params
    // If the route has params we want to coerce the values to the expected types.

    if (route.state.params !== undefined) {
      const result = await route.state.params.safeParseAsync(params);
      if (result.success === false) {
        return toResponse(ValidationError.fromZod(result.error, "params", "Invalid request params"), request);
      }
      input.params = result.data;
    }

    // ### Query
    // If the route has a query schema we need to validate and parse the query.

    if (route.state.query !== undefined) {
      const result = await route.state.query.safeParseAsync(toQuery(url.searchParams) ?? {});
      if (result.success === false) {
        return toResponse(ValidationError.fromZod(result.error, "query", "Invalid request query"), request);
      }
      input.query = result.data;
    }

    // ### Body
    // If the route has a body schema we need to validate and parse the body.

    if (route.state.body !== undefined) {
      const body = await this.#getRequestBody(request);
      const result = await route.state.body.safeParseAsync(body);
      if (result.success === false) {
        return toResponse(ValidationError.fromZod(result.error, "body", "Invalid request body"), request);
      }
      input.body = result.data;
    }

    if (input.params !== undefined || input.query !== undefined || input.body !== undefined) {
      args.push(input);
    }

    // ### Context
    // Request context pass to every route as the last argument.

    args.push(context);

    // ### Handler
    // Execute the route handler and apply the result.

    if (route.state.handle === undefined) {
      return toResponse(new NotImplementedError(`Path '${route.method} ${route.path}' is not implemented.`), request);
    }

    return toResponse(await route.state.handle(...args), request);
  }

  #getErrorResponse(error: unknown, request: Request): Response {
    if (error instanceof ServerError) {
      return toResponse(error, request);
    }
    logger.error(error);
    if (error instanceof Error) {
      return toResponse(new InternalServerError(error.message), request);
    }
    return toResponse(new InternalServerError(), request);
  }

  /**
   * Resolves request body and returns it.
   *
   * @param request - Request to resolve body from.
   * @param files   - Files to populate if present.
   */
  async #getRequestBody(request: Request): Promise<Record<string, unknown>> {
    let body: Record<string, unknown> = {};

    const type = request.headers.get("content-type");
    if (!type || request.method === "GET") {
      return body;
    }

    if (type.includes("json")) {
      body = await request.json();
    }

    if (type.includes("application/x-www-form-urlencoded") || type.includes("multipart/form-data")) {
      try {
        const formData = await request.formData();
        for (const [name, value] of Array.from(formData.entries())) {
          body[name] = value;
        }
      } catch (error) {
        logger.error(error);
        throw new BadRequestError(`Malformed FormData`, { error });
      }
    }

    return body;
  }
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

/**
 * Resolve and return query object from the provided search parameters, or undefined
 * if the search parameters does not have any entries.
 *
 * @param searchParams - Search params to create a query object from.
 */
function toQuery(searchParams: URLSearchParams): object | undefined {
  if (searchParams.size === 0) {
    return undefined;
  }
  const result: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    result[key] = value;
  }
  return result;
}

/**
 * Takes a server side request result and returns a fetch Response.
 *
 * @param result  - Result to send back as a Response.
 * @param request - Request instance.
 */
export function toResponse(result: unknown, request: Request): Response {
  const method = request.method;

  if (result instanceof Response) {
    if (method === "HEAD") {
      return new Response(null, {
        status: result.status,
        statusText: result.statusText,
        headers: new Headers(result.headers),
      });
    }
    return result;
  }
  if (result instanceof ServerError) {
    const body = JSON.stringify({
      code: result.code as any,
      status: result.status,
      message: result.message,
      data: result.data,
    } satisfies ServerErrorJSON);

    return new Response(method === "HEAD" ? null : body, {
      statusText: result.message || "Internal Server Error",
      status: result.status || 500,
      headers: {
        "content-type": "application/json",
      },
    });
  }

  const body = result !== undefined ? JSON.stringify(result) : null;

  return new Response(method === "HEAD" ? null : body, {
    status: 200,
    headers: {
      "content-type": "application/json",
    },
  });
}

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

type Routes = {
  POST: Route[];
  GET: Route[];
  PUT: Route[];
  PATCH: Route[];
  DELETE: Route[];
};

type ResolvedRoute = {
  route: Route;
  params: any;
};
