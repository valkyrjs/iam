import auth from "@modules/auth";
import tenant from "@modules/tenant";
import { logger } from "@platform/logger";
import { NotFoundError, NotImplementedError, UnauthorizedError, ValidationError } from "@platform/relay";
import { mergeContexts, storage } from "@platform/request";
import server, { getRequestBody, RouteRegistry, toQuery, toResponse } from "@platform/server";

import { config } from "./config.ts";

const log = logger.prefix("Server");

/*
 |--------------------------------------------------------------------------------
 | Routes
 |--------------------------------------------------------------------------------
 */

const routes = new RouteRegistry([...(await auth.routes()), ...(await tenant.routes())]);

/*
 |--------------------------------------------------------------------------------
 | Context
 |--------------------------------------------------------------------------------
 */

const context = mergeContexts(server.context, auth.context);

/*
 |--------------------------------------------------------------------------------
 | Server
 |--------------------------------------------------------------------------------
 */

Deno.serve(
  {
    port: config.port,
    hostname: config.host,
    onListen({ port, hostname }) {
      logger.prefix("Server").info(`Listening at http://${hostname}:${port}`);
    },
  },
  async (request) => {
    const start = Date.now();

    // ### Storage
    // Resolve data to be added to the AsyncLocalStorage context for this request.

    const { headers, url } = await server.storage(request);
    const { principal, session, user } = await auth.storage(request);

    // ### Route
    // Locate a route matching the incoming request method and path.

    const { route, params } = routes.getRoute(request.method, url.pathname);
    if (route === undefined) {
      return toResponse(
        new NotFoundError(`Invalid routing path provided for ${request.url}`, {
          method: request.method,
          url: request.url,
        }),
        request,
      );
    }

    // ### Access
    // Check if the request has access to the route.

    if (route.state.access !== "public" && session === undefined) {
      return toResponse(new UnauthorizedError(), request);
    }

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
      const body = await getRequestBody(request);
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

    const handle = route.state.handle;
    if (handle === undefined) {
      return toResponse(new NotImplementedError(`Path '${route.method} ${route.path}' is not implemented.`), request);
    }

    return storage
      .run(
        {
          headers,
          url,
          principal,
          session,
          user,
        },
        async () => toResponse(await handle(...args), request),
      )
      .finally(() => {
        log.info(`${request.method} ${url.pathname} [${((Date.now() - start) / 1000).toLocaleString()} seconds]`);
      });
  },
);
