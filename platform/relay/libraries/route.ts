import type { RequestContext } from "@platform/request";
import { type MatchFunction, match } from "path-to-regexp";
import z, { type ZodObject, type ZodRawShape, type ZodType } from "zod";

import { ServerError, type ServerErrorClass } from "./errors.ts";

export class Route<const TState extends RouteState = RouteState> {
  readonly type = "route" as const;

  declare readonly $params: TState["params"] extends ZodObject ? z.input<TState["params"]> : never;
  declare readonly $query: TState["query"] extends ZodObject ? z.input<TState["query"]> : never;
  declare readonly $body: TState["body"] extends ZodType ? z.input<TState["body"]> : never;
  declare readonly $response: TState["output"] extends ZodType ? z.output<TState["output"]> : never;

  #matchFn?: MatchFunction<any>;

  /**
   * Instantiate a new Route instance.
   *
   * @param state - Route state.
   */
  constructor(readonly state: TState) {}

  /**
   * HTTP Method
   */
  get method(): RouteMethod {
    return this.state.method;
  }

  /**
   * URL pattern of the route.
   */
  get matchFn(): MatchFunction<any> {
    if (this.#matchFn === undefined) {
      this.#matchFn = match(this.path);
    }
    return this.#matchFn;
  }

  /**
   * URL path
   */
  get path(): string {
    return this.state.path;
  }

  /**
   * Check if the provided URL matches the route pattern.
   *
   * @param url - HTTP request.url
   */
  match(url: string): boolean {
    return this.matchFn(url) !== false;
  }

  /**
   * Extract parameters from the provided URL based on the route pattern.
   *
   * @param url - HTTP request.url
   */
  getParsedParams<TParams = TState["params"] extends ZodObject ? z.infer<TState["params"]> : object>(
    url: string,
  ): TParams {
    const result = this.matchFn(url);
    if (result === false) {
      return {} as TParams;
    }
    return result.params as TParams;
  }

  /**
   * Set the meta data for this route which can be used in e.g. OpenAPI generation
   *
   * @param meta - Meta object
   *
   * @examples
   *
   * ```ts
   * route.post("/foo").meta({ description: "Super route" });
   * ```
   */
  meta<TRouteMeta extends RouteMeta>(meta: TRouteMeta): Route<Prettify<Omit<TState, "meta"> & { meta: TRouteMeta }>> {
    return new Route({ ...this.state, meta });
  }

  /**
   * Access level of the route which acts as the first barrier of entry
   * to ensure that requests are valid.
   *
   * By default on the server the lack of access definition will result
   * in an error as all routes needs an access definition.
   *
   * @param access - Access level of the route.
   *
   * @examples
   *
   * ```ts
   * const hasFooBar = action
   *   .make("hasFooBar")
   *   .response(z.object({ foobar: z.number() }))
   *   .handle(async () => {
   *     return {
   *       foobar: 1,
   *     };
   *   });
   *
   * // ### Public Endpoint
   *
   * route
   *   .post("/foo")
   *   .access("public")
   *   .handle(async ({ foobar }) => {
   *     console.log(typeof foobar); // => number
   *   });
   *
   * // ### Require Session
   *
   * route
   *   .post("/foo")
   *   .access("session")
   *   .handle(async ({ foobar }) => {
   *     console.log(typeof foobar); // => number
   *   });
   *
   * // ### Require Session & Resource Assignment
   *
   * route
   *   .post("/foo")
   *   .access([resource("foo", "create")])
   *   .handle(async ({ foobar }) => {
   *     console.log(typeof foobar); // => number
   *   });
   * ```
   */
  access<TAccess extends RouteAccess>(access: TAccess): Route<Prettify<Omit<TState, "access"> & { access: TAccess }>> {
    return new Route({ ...this.state, access: access as TAccess });
  }

  /**
   * Params allows for custom casting of URL parameters. If a parameter does not
   * have a corresponding zod schema the default param type is "string".
   *
   * @param params - URL params.
   *
   * @examples
   *
   * ```ts
   * route
   *   .post("/foo/:bar")
   *   .params({
   *     bar: z.coerce.number()
   *   })
   *   .handle(async ({ bar }) => {
   *     console.log(typeof bar); // => number
   *   });
   * ```
   */
  params<TParams extends ZodRawShape>(
    params: TParams,
  ): Route<Prettify<Omit<TState, "params"> & { params: ZodObject<TParams> }>> {
    return new Route({ ...this.state, params: z.object(params) as any });
  }

  /**
   * Search allows for custom casting of URL query parameters. If a parameter does
   * not have a corresponding zod schema the default param type is "string".
   *
   * @param query - URL query arguments.
   *
   * @examples
   *
   * ```ts
   * route
   *   .post("/foo")
   *   .query({
   *     bar: z.number({ coerce: true })
   *   })
   *   .handle(async ({ bar }) => {
   *     console.log(typeof bar); // => number
   *   });
   * ```
   */
  query<TQuery extends ZodRawShape>(
    query: TQuery,
  ): Route<Prettify<Omit<TState, "search"> & { query: ZodObject<TQuery> }>> {
    return new Route({ ...this.state, query: z.strictObject(query) as any });
  }

  /**
   * Shape of the body this route expects to receive. This is used by all
   * mutator routes and has no effect when defined on "GET" methods.
   *
   * @param body - Body the route expects.
   *
   * @examples
   *
   * ```ts
   * route
   *   .post("/foo")
   *   .body(
   *     z.object({
   *       bar: z.number()
   *     })
   *   )
   *   .handle(async ({ body: { bar } }) => {
   *     console.log(typeof bar); // => number
   *   });
   * ```
   */
  body<TBody extends ZodType>(body: TBody): Route<Prettify<Omit<TState, "body"> & { body: TBody }>> {
    return new Route({ ...this.state, body });
  }

  /**
   * Instances of the possible error responses this route produces.
   *
   * @param errors - Error shapes of the route.
   *
   * @examples
   *
   * ```ts
   * route
   *   .post("/foo")
   *   .errors([
   *     BadRequestError
   *   ])
   *   .handle(async () => {
   *     return new BadRequestError();
   *   });
   * ```
   */
  errors<TErrors extends ServerErrorClass[]>(
    errors: TErrors,
  ): Route<Prettify<Omit<TState, "errors"> & { errors: TErrors }>> {
    return new Route({ ...this.state, errors });
  }

  /**
   * Shape of the response this route produces. This is used by the transform
   * tools to ensure the client receives parsed data.
   *
   *
   * @examples
   *
   * ```ts
   * route
   *   .post("/foo")
   *   .response(
   *     z.object({
   *       bar: z.number()
   *     })
   *   )
   *   .handle(async () => {
   *     return {
   *       bar: 1
   *     }
   *   });
   * ```
   * @param output the response type from the method
   */
  response<TResponse extends ZodType>(
    output: TResponse,
  ): Route<Prettify<Omit<TState, "output"> & { output: TResponse }>> {
    return new Route({ ...this.state, output });
  }

  /**
   * Server handler callback method.
   *
   * Handler receives the params, query, body, actions in order of definition.
   * So if your route has params, and body the route handle method will
   * receive (params, body) as arguments.
   *
   * @param handle - Handle function to trigger when the route is executed.
   *
   * @examples
   *
   * ```ts
   * relay
   *  .post("/foo/:bar")
   *  .params({ bar: z.string() })
   *  .body(z.tuple([z.string(), z.number()]))
   *  .handle(async ({ bar }, [ "string", number ]) => {});
   * ```
   *
   * ```ts
   * const prefix = actions
   *   .make("prefix")
   *   .input(z.string())
   *   .output({ prefixed: z.string() })
   *   .handle(async (value) => ({
   *     prefixed: `prefix_${value}`;
   *   }))
   *
   * relay
   *   .post("/foo")
   *   .body(z.object({ bar: z.string() }))
   *   .actions([prefix, (body) => body.bar])
   *   .handle(async ({ bar }, { prefixed }) => {
   *     console.log(prefixed); => prefixed_${bar}
   *   });
   * ```
   */
  handle<THandleFn extends HandleFn<ServerArgs<TState>, TState["output"]>>(
    handle: THandleFn,
  ): Route<Prettify<Omit<TState, "handle"> & { handle: THandleFn }>> {
    return new Route({ ...this.state, handle });
  }
}

/*
 |--------------------------------------------------------------------------------
 | Factories
 |--------------------------------------------------------------------------------
 */

/**
 * Route factories allowing for easy generation of relay compliant routes.
 */
export const route: {
  post<TPath extends string>(
    path: TPath,
  ): Route<{ method: "POST"; path: TPath; access: "authenticated"; errors: [ServerErrorClass] }>;
  get<TPath extends string>(
    path: TPath,
  ): Route<{ method: "GET"; path: TPath; access: "authenticated"; errors: [ServerErrorClass] }>;
  put<TPath extends string>(
    path: TPath,
  ): Route<{ method: "PUT"; path: TPath; access: "authenticated"; errors: [ServerErrorClass] }>;
  patch<TPath extends string>(
    path: TPath,
  ): Route<{ method: "PATCH"; path: TPath; access: "authenticated"; errors: [ServerErrorClass] }>;
  delete<TPath extends string>(
    path: TPath,
  ): Route<{ method: "DELETE"; path: TPath; access: "authenticated"; errors: [ServerErrorClass] }>;
} = {
  /**
   * Create a new "POST" route for the given path.
   *
   * @param path - Path to generate route for.
   *
   * @examples
   *
   * ```ts
   * route
   *   .post("/foo")
   *   .body(
   *     z.object({ bar: z.string() })
   *   );
   * ```
   */
  post<TPath extends string>(path: TPath) {
    return new Route({ method: "POST", path, access: "authenticated", errors: [ServerError] });
  },

  /**
   * Create a new "GET" route for the given path.
   *
   * @param path - Path to generate route for.
   *
   * @examples
   *
   * ```ts
   * route.get("/foo");
   * ```
   */
  get<TPath extends string>(path: TPath) {
    return new Route({ method: "GET", path, access: "authenticated", errors: [ServerError] });
  },

  /**
   * Create a new "PUT" route for the given path.
   *
   * @param path - Path to generate route for.
   *
   * @examples
   *
   * ```ts
   * route
   *   .put("/foo")
   *   .body(
   *     z.object({ bar: z.string() })
   *   );
   * ```
   */
  put<TPath extends string>(path: TPath) {
    return new Route({ method: "PUT", path, access: "authenticated", errors: [ServerError] });
  },

  /**
   * Create a new "PATCH" route for the given path.
   *
   * @param path - Path to generate route for.
   *
   * @examples
   *
   * ```ts
   * route
   *   .patch("/foo")
   *   .body(
   *     z.object({ bar: z.string() })
   *   );
   * ```
   */
  patch<TPath extends string>(path: TPath) {
    return new Route({ method: "PATCH", path, access: "authenticated", errors: [ServerError] });
  },

  /**
   * Create a new "DELETE" route for the given path.
   *
   * @param path - Path to generate route for.
   *
   * @examples
   *
   * ```ts
   * route.delete("/foo");
   * ```
   */
  delete<TPath extends string>(path: TPath) {
    return new Route({ method: "DELETE", path, access: "authenticated", errors: [ServerError] });
  },
};

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

export type Routes = {
  [key: string]: Routes | Route | RouteFn;
};

export type RouteFn = (...args: any[]) => any;

type RouteState = {
  method: RouteMethod;
  path: string;
  access: RouteAccess;
  meta?: RouteMeta;
  params?: ZodObject;
  query?: ZodObject;
  body?: ZodType;
  output?: ZodType;
  errors: ServerErrorClass[];
  handle?: HandleFn;
};

export type RouteMeta = {
  openapi?: "internal" | "external";
  description?: string;
  summary?: string;
  tags?: string[];
} & Record<string, unknown>;

export type RouteMethod = "POST" | "GET" | "PUT" | "PATCH" | "DELETE";

export type RouteAccess = "public" | "authenticated";

type HandleFn<TArgs extends Array<any> = any[], TResponse = any> = (
  ...args: TArgs
) => TResponse extends ZodType
  ? Promise<z.infer<TResponse> | Response | ServerError>
  : Promise<Response | ServerError | void>;

type ServerArgs<TState extends RouteState> = HasInputArgs<TState> extends true
  ? [
      (TState["params"] extends ZodObject ? { params: z.output<TState["params"]> } : unknown) &
        (TState["query"] extends ZodObject ? { query: z.output<TState["query"]> } : unknown) &
        (TState["body"] extends ZodType ? { body: z.output<TState["body"]> } : unknown),
      RequestContext,
    ]
  : [RequestContext];

type HasInputArgs<TState extends RouteState> = TState["params"] extends ZodObject
  ? true
  : TState["query"] extends ZodObject
    ? true
    : TState["body"] extends ZodType
      ? true
      : false;

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
