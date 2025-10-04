import type { ZodError } from "zod/v4";

const STATUS_CODE: Record<number, ServerErrorJSON["code"]> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  405: "METHOD_NOT_ALLOWED",
  406: "NOT_ACCEPTABLE",
  409: "CONFLICT",
  410: "GONE",
  415: "UNSUPPORTED_MEDIA_TYPE",
  422: "UNPROCESSABLE_CONTENT",
  500: "INTERNAL_SERVER",
  501: "NOT_IMPLEMENTED",
  503: "SERVICE_UNAVAILABLE",
};

export abstract class ServerError<TData = unknown> extends Error {
  abstract readonly code: string;

  constructor(
    message: string,
    readonly status: number,
    readonly data?: TData,
  ) {
    super(message);
  }

  /**
   * Converts a server delivered JSON error to its native instance.
   *
   * @param error - Error JSON.
   */
  static fromJSON(error: ServerErrorJSON): ServerErrorType {
    switch (error.code) {
      case "BAD_REQUEST":
        return new BadRequestError(error.message, error.data);
      case "UNAUTHORIZED":
        return new UnauthorizedError(error.message, error.data);
      case "FORBIDDEN":
        return new ForbiddenError(error.message, error.data);
      case "NOT_FOUND":
        return new NotFoundError(error.message, error.data);
      case "METHOD_NOT_ALLOWED":
        return new MethodNotAllowedError(error.message, error.data);
      case "NOT_ACCEPTABLE":
        return new NotAcceptableError(error.message, error.data);
      case "CONFLICT":
        return new ConflictError(error.message, error.data);
      case "GONE":
        return new GoneError(error.message, error.data);
      case "UNSUPPORTED_MEDIA_TYPE":
        return new UnsupportedMediaTypeError(error.message, error.data);
      case "UNPROCESSABLE_CONTENT":
        return new UnprocessableContentError(error.message, error.data);
      case "VALIDATION":
        return new ValidationError(error.message, error.data);
      case "INTERNAL_SERVER":
        return new InternalServerError(error.message, error.data);
      case "NOT_IMPLEMENTED":
        return new NotImplementedError(error.message, error.data);
      case "SERVICE_UNAVAILABLE":
        return new ServiceUnavailableError(error.message, error.data);
      default:
        return new InternalServerError(error.message, error.data);
    }
  }

  /**
   * Convert error instance to a JSON object.
   */
  toJSON(): ServerErrorJSON {
    return {
      code: this.code as ServerErrorJSON["code"],
      status: this.status,
      message: this.message,
      data: this.data,
    };
  }
}

export class BadRequestError<TData = unknown> extends ServerError<TData> {
  readonly code = "BAD_REQUEST";

  /**
   * Instantiate a new BadRequestError.
   *
   * The **HTTP 400 Bad Request** response status code indicates that the server
   * cannot or will not process the request due to something that is perceived to
   * be a client error.
   *
   * @param message - the message that describes the error. Default: "Bad Request".
   * @param data - Optional data to send with the error.
   */
  constructor(message = "Bad Request", data?: TData) {
    super(message, 400, data);
  }
}

export class UnauthorizedError<TData = unknown> extends ServerError<TData> {
  readonly code = "UNAUTHORIZED";

  /**
   * Instantiate a new UnauthorizedError.
   *
   * The **HTTP 401 Unauthorized** response status code indicates that the client
   * request has not been completed because it lacks valid authentication
   * credentials for the requested resource.
   *
   * This status code is sent with an HTTP WWW-Authenticate response header that
   * contains information on how the client can request for the resource again after
   * prompting the user for authentication credentials.
   *
   * This status code is similar to the **403 Forbidden** status code, except that
   * in situations resulting in this status code, user authentication can allow
   * access to the resource.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401
   *
   * @param message - Optional message to send with the error. Default: "Unauthorized".
   * @param data    - Optional data to send with the error.
   */
  constructor(message = "Unauthorized", data?: TData) {
    super(message, 401, data);
  }
}

export class ForbiddenError<TData = unknown> extends ServerError<TData> {
  readonly code = "FORBIDDEN";

  /**
   * Instantiate a new ForbiddenError.
   *
   * The **HTTP 403 Forbidden** response status code indicates that the server
   * understands the request but refuses to authorize it.
   *
   * This status is similar to **401**, but for the **403 Forbidden** status code
   * re-authenticating makes no difference. The access is permanently forbidden and
   * tied to the application logic, such as insufficient rights to a resource.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/403
   *
   * @param message - Optional message to send with the error. Default: "Forbidden".
   * @param data    - Optional data to send with the error.
   */
  constructor(message = "Forbidden", data?: TData) {
    super(message, 403, data);
  }
}

export class NotFoundError<TData = unknown> extends ServerError<TData> {
  readonly code = "NOT_FOUND";

  /**
   * Instantiate a new NotFoundError.
   *
   * The **HTTP 404 Not Found** response status code indicates that the server
   * cannot find the requested resource. Links that lead to a 404 page are often
   * called broken or dead links and can be subject to link rot.
   *
   * A 404 status code only indicates that the resource is missing: not whether the
   * absence is temporary or permanent. If a resource is permanently removed,
   * use the **410 _(Gone)_** status instead.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/404
   *
   * @param message - Optional message to send with the error. Default: "Not Found".
   * @param data    - Optional data to send with the error.
   */
  constructor(message = "Not Found", data?: TData) {
    super(message, 404, data);
  }
}

export class MethodNotAllowedError<TData = unknown> extends ServerError<TData> {
  readonly code = "METHOD_NOT_ALLOWED";

  /**
   * Instantiate a new MethodNotAllowedError.
   *
   * The **HTTP 405 Method Not Allowed** response code indicates that the
   * request method is known by the server but is not supported by the target resource.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/405
   *
   * @param message - Optional message to send with the error. Default: "Method Not Allowed".
   * @param data    - Optional data to send with the error.
   */
  constructor(message = "Method Not Allowed", data?: TData) {
    super(message, 405, data);
  }
}

export class NotAcceptableError<TData = unknown> extends ServerError<TData> {
  readonly code = "NOT_ACCEPTABLE";

  /**
   * Instantiate a new NotAcceptableError.
   *
   * The **HTTP 406 Not Acceptable** client error response code indicates that the
   * server cannot produce a response matching the list of acceptable values
   * defined in the request, and that the server is unwilling to supply a default
   * representation.
   *
   * @param message - Optional message to send with the error. Default: "Not Acceptable".
   * @param data    - Optional data to send with the error.
   */
  constructor(message = "Not Acceptable", data?: TData) {
    super(message, 406, data);
  }
}

export class ConflictError<TData = unknown> extends ServerError<TData> {
  readonly code = "CONFLICT";

  /**
   * Instantiate a new ConflictError.
   *
   * The **HTTP 409 Conflict** response status code indicates a request conflict
   * with the current state of the target resource.
   *
   * Conflicts are most likely to occur in response to a PUT request. For example,
   * you may get a 409 response when uploading a file that is older than the
   * existing one on the server, resulting in a version control conflict.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/409
   *
   * @param message - Optional message to send with the error. Default: "Conflict".
   * @param data    - Optional data to send with the error.
   */
  constructor(message = "Conflict", data?: TData) {
    super(message, 409, data);
  }
}

export class GoneError<TData = unknown> extends ServerError<TData> {
  readonly code = "GONE";

  /**
   * Instantiate a new GoneError.
   *
   * The **HTTP 410 Gone** indicates that the target resource is no longer
   * available at the origin server and that this condition is likely to be
   * permanent. A 410 response is cacheable by default.
   *
   * Clients should not repeat requests for resources that return a 410 response,
   * and website owners should remove or replace links that return this code. If
   * server owners don't know whether this condition is temporary or permanent,
   * a 404 status code should be used instead.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/410
   *
   * @param message - Optional message to send with the error. Default: "Gone".
   * @param data    - Optional data to send with the error.
   */
  constructor(message = "Gone", data?: TData) {
    super(message, 410, data);
  }
}

export class UnsupportedMediaTypeError<TData = unknown> extends ServerError<TData> {
  readonly code = "UNSUPPORTED_MEDIA_TYPE";

  /**
   * Instantiate a new UnsupportedMediaTypeError.
   *
   * The **HTTP 415 Unsupported Media Type** response code indicates that the
   * server refuses to accept the request because the payload format is in an unsupported format.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/415
   *
   * @param message - Optional message to send with the error. Default: "Unsupported Media Type".
   * @param data    - Optional data to send with the error.
   */
  constructor(message = "Unsupported Media Type", data?: TData) {
    super(message, 415, data);
  }
}

export class UnprocessableContentError<TData = unknown> extends ServerError<TData> {
  readonly code = "UNPROCESSABLE_CONTENT";

  /**
   * Instantiate a new UnprocessableContentError.
   *
   * The **HTTP 422 Unprocessable Content** client error response status code
   * indicates that the server understood the content type of the request entity,
   * and the syntax of the request entity was correct, but it was unable to
   * process the contained instructions.
   *
   * Clients that receive a 422 response should expect that repeating the request
   * without modification will fail with the same error.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422
   *
   * @param message - Optional message to send with the error. Default: "Unprocessable Content".
   * @param data    - Optional data to send with the error.
   */
  constructor(message = "Unprocessable Content", data?: TData) {
    super(message, 422, data);
  }
}

export class ValidationError extends ServerError<ValidationErrorData> {
  readonly code = "VALIDATION";

  /**
   * Instantiate a new ValidationError.
   *
   * This indicates that the server understood the request, but the content
   * failed semantic validation against the expected schema.
   *
   * @param message - Optional message to send with the error. Default: "Validation Failed".
   * @param data    - Data with validation failure details.
   */
  constructor(message = "Validation Failed", data: ValidationErrorData) {
    super(message, 422, data);
  }

  /**
   * Instantiate a new ValidationError.
   *
   * This indicates that the server understood the request, but the content
   * failed semantic validation against the expected schema.
   *
   * @param zodError - The original ZodError instance.
   * @param source   - The source of the validation error.
   * @param message  - Optional override for the main error message.
   */
  static fromZod(zodError: ZodError, source: ErrorSource, message?: string) {
    return new ValidationError(message, {
      details: zodError.issues.map((issue) => {
        return {
          source: source,
          code: issue.code,
          field: issue.path.join("."),
          message: issue.message,
        };
      }),
      stack: zodError.stack?.split("\n").filter((str) => str.trim().startsWith("at ")),
    });
  }
}

export class InternalServerError<TData = unknown> extends ServerError<TData> {
  readonly code = "INTERNAL_SERVER";

  /**
   * Instantiate a new InternalServerError.
   *
   * The **HTTP 500 Internal Server Error** server error response code indicates that
   * the server encountered an unexpected condition that prevented it from fulfilling
   * the request.
   *
   * This error response is a generic "catch-all" response. Usually, this indicates
   * the server cannot find a better 5xx error code to response. Sometimes, server
   * administrators log error responses like the 500 status code with more details
   * about the request to prevent the error from happening again in the future.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/500
   *
   * @param message - Optional message to send with the error. Default: "Internal Server Error".
   * @param data    - Optional data to send with the error.
   */
  constructor(message = "Internal Server Error", data?: TData) {
    super(message, 500, data);
  }
}

export class NotImplementedError<TData = unknown> extends ServerError<TData> {
  readonly code = "NOT_IMPLEMENTED";

  /**
   * Instantiate a new NotImplementedError.
   *
   * The **HTTP 501 Not Implemented** server error response status code means that
   * the server does not support the functionality required to fulfill the request.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/501
   *
   * @param message - Optional message to send with the error. Default: "Service Unavailable".
   * @param data    - Optional data to send with the error.
   */
  constructor(message = "Not Implemented", data?: TData) {
    super(message, 501, data);
  }
}

export class ServiceUnavailableError<TData = unknown> extends ServerError<TData> {
  readonly code = "SERVICE_UNAVAILABLE";

  /**
   * Instantiate a new ServiceUnavailableError.
   *
   * The **HTTP 503 Service Unavailable** server error response status code indicates
   * that the server is not ready to handle the request.
   *
   * This response should be used for temporary conditions and the Retry-After HTTP header
   * should contain the estimated time for the recovery of the service, if possible.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/503
   *
   * @param message - Optional message to send with the error. Default: "Service Unavailable".
   * @param data    - Optional data to send with the error.
   */
  constructor(message = "Service Unavailable", data?: TData) {
    super(message, 503, data);
  }
}

export function errorStatusToErrorCode(status: number): ServerErrorJSON["code"] {
  const code = STATUS_CODE[status];
  if (!code) {
    return "INTERNAL_SERVER";
  }
  return code;
}

/*
 |--------------------------------------------------------------------------------
 | Groups
 |--------------------------------------------------------------------------------
 */

export const SessionErrors = [UnauthorizedError, ForbiddenError];

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

export type ServerErrorJSON = {
  code: ServerErrorType["code"];
  status: number;
  message: string;
  data?: any;
};

export type ServerErrorClass<TData = unknown> = typeof ServerError<TData>;

export type ServerErrorType =
  | BadRequestError
  | UnauthorizedError
  | ForbiddenError
  | NotFoundError
  | MethodNotAllowedError
  | NotAcceptableError
  | ConflictError
  | GoneError
  | UnsupportedMediaTypeError
  | UnprocessableContentError
  | NotImplementedError
  | ServiceUnavailableError
  | ValidationError
  | InternalServerError;

export type ErrorSource = "body" | "query" | "params" | "internal" | "client";

type ValidationErrorData = {
  details: ValidationErrorDetail[];
  stack?: string[];
};

type ValidationErrorDetail = {
  source: ErrorSource;
  code: string;
  field: string;
  message: string;
};
