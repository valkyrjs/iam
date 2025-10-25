import { logger } from "@platform/logger";
import { BadRequestError, InternalServerError, ServerError, type ServerErrorJSON } from "@platform/relay";

/**
 * Resolve and return query object from the provided search parameters, or undefined
 * if the search parameters does not have any entries.
 *
 * @param searchParams - Search params to create a query object from.
 */
export function toQuery(searchParams: URLSearchParams): object | undefined {
  if (searchParams.size === 0) {
    return undefined;
  }
  const result: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    result[key] = value;
  }
  return result;
}

export async function getRequestBody(request: Request): Promise<Record<string, unknown>> {
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

export function getErrorResponse(error: unknown, request: Request): Response {
  if (error instanceof ServerError) {
    return toResponse(error, request);
  }
  logger.error(error);
  if (error instanceof Error) {
    return toResponse(new InternalServerError(error.message), request);
  }
  return toResponse(new InternalServerError(), request);
}
