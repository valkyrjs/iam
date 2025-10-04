import { createDocument, type ZodOpenApiParameters, type ZodOpenApiPathsObject } from "zod-openapi";

import type { Route, RouteMethod } from "./route.ts";

/**
 * Convert a list of route specifications to a compliant open api object.
 *
 * **WARNING** Be aware that all ZOD schemas used here - must use the `.meta()` option as not to
 * produce gibberish in the output.
 *
 * e.g. `z.string().meta({ description: "Some desc" })`
 *
 * @param routes - List of routes to generate a open-api spec for.
 */
export function routesToOpenApi(routes: Route[], scope?: string) {
  const paths: ZodOpenApiPathsObject = {};

  for (const route of routes) {
    if (!paths[route.path]) {
      paths[route.path] = {};
    }

    const method = route.method.toLowerCase() as Lowercase<RouteMethod>;

    paths[route.path][method] = {
      requestParams: getRequestParams(route),
      requestBody: route.state.body
        ? {
            content: {
              "application/json": {
                schema: route.state.body,
              },
            },
          }
        : undefined,
      // TODO: introduce the ability to define error responses on the
      //       specification layer.
      responses: {
        "200": {
          description: "200 OK",
          content: {
            "application/json": { schema: route.state.output },
          },
        },
      },
    };
  }

  return createDocument({
    openapi: "3.1.0",
    info: {
      title: `IAM API${scope ? ` [${scope}]` : ""}`,
      version: "1.0.0",
    },
    paths: paths,
  });
}

function getRequestParams(route: Route): ZodOpenApiParameters | undefined {
  const { query, params } = route.state;
  if (!query && !params) {
    return;
  }
  if (!query && params) {
    return {
      path: params,
    };
  }
  if (!params && query) {
    return {
      query: query,
    };
  }
  return {
    path: params,
    query: query,
  };
}
