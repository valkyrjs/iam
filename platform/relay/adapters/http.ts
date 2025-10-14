import { assertServerErrorResponse, type RelayAdapter, type RelayInput, type RelayResponse } from "../adapter.ts";
import { ServerError, type ServerErrorJSON, type ServerErrorType } from "../errors.ts";

/**
 * HttpAdapter provides a unified transport layer for Relay.
 *
 * It supports sending JSON objects, nested structures, arrays, and file uploads
 * via FormData. The adapter automatically detects the payload type and formats
 * the request accordingly. Responses are normalized into `RelayResponse`.
 *
 * @example
 * ```ts
 * const adapter = new HttpAdapter({ url: "https://api.example.com" });
 *
 * // Sending JSON data
 * const jsonResponse = await adapter.send({
 *   method: "POST",
 *   endpoint: "/users",
 *   body: { name: "Alice", age: 30 },
 * });
 *
 * // Sending files and nested objects
 * const formResponse = await adapter.send({
 *   method: "POST",
 *   endpoint: "/upload",
 *   body: {
 *     user: { name: "Bob", avatar: fileInput.files[0] },
 *     documents: [fileInput.files[1], fileInput.files[2]],
 *   },
 * });
 * ```
 */
export class HttpAdapter implements RelayAdapter {
  /**
   * Instantiate a new HttpAdapter instance.
   *
   * @param options - Adapter options.
   */
  constructor(readonly options: HttpAdapterOptions) {}

  /**
   * Override the initial url value set by instantiator.
   */
  set url(value: string) {
    this.options.url = value;
  }

  /**
   * Retrieve the URL value from options object.
   */
  get url() {
    return this.options.url;
  }

  /**
   * Return the full URL from given endpoint.
   *
   * @param endpoint - Endpoint to get url for.
   */
  getUrl(endpoint: string): string {
    return `${this.url}${endpoint}`;
  }

  async send({ method, endpoint, query, body, headers = new Headers() }: RelayInput): Promise<RelayResponse> {
    const init: RequestInit = { method, headers };

    // ### Before Request
    // If any before request hooks has been defined, we run them here passing in the
    // request headers for further modification.

    await this.#beforeRequest(headers);

    // ### Body

    if (body !== undefined) {
      const type = this.#getRequestFormat(body);
      if (type === "form-data") {
        headers.delete("content-type");
        init.body = this.#getFormData(body);
      }
      if (type === "json") {
        headers.set("content-type", "application/json");
        init.body = JSON.stringify(body);
      }
    }

    // ### Response

    return this.request(`${endpoint}${query}`, init);
  }

  /**
   * Send a fetch request using the given fetch options and returns
   * a relay formatted response.
   *
   * @param endpoint - Which endpoint to submit request to.
   * @param init     - Request init details to submit with the request.
   */
  async request(endpoint: string, init?: RequestInit): Promise<RelayResponse> {
    return this.#toResponse(await fetch(this.getUrl(endpoint), init));
  }

  /**
   * Run before request operations.
   *
   * @param headers - Headers to pass to hooks.
   */
  async #beforeRequest(headers: Headers) {
    if (this.options.hooks?.beforeRequest !== undefined) {
      for (const hook of this.options.hooks.beforeRequest) {
        await hook(headers);
      }
    }
  }

  /**
   * Determine the parser method required for the request.
   *
   * @param body - Request body.
   */
  #getRequestFormat(body: unknown): "form-data" | "json" {
    if (containsFile(body) === true) {
      return "form-data";
    }
    return "json";
  }

  /**
   * Get FormData instance for the given body.
   *
   * @param body - Request body.
   */
  #getFormData(data: Record<string, unknown>, formData = new FormData(), parentKey?: string): FormData {
    for (const key in data) {
      const value = data[key];
      if (value === undefined || value === null) continue;

      const formKey = parentKey ? `${parentKey}[${key}]` : key;

      if (value instanceof File) {
        formData.append(formKey, value, value.name);
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (item instanceof File) {
            formData.append(`${formKey}[${index}]`, item, item.name);
          } else if (typeof item === "object") {
            this.#getFormData(item as Record<string, unknown>, formData, `${formKey}[${index}]`);
          } else {
            formData.append(`${formKey}[${index}]`, String(item));
          }
        });
      } else if (typeof value === "object") {
        this.#getFormData(value as Record<string, unknown>, formData, formKey);
      } else {
        formData.append(formKey, String(value));
      }
    }

    return formData;
  }

  /**
   * Convert a fetch response to a compliant relay response.
   *
   * @param response - Fetch response to convert.
   */
  async #toResponse(response: Response): Promise<RelayResponse> {
    const type = response.headers.get("content-type");

    // ### Content Type
    // Ensure that the server responds with a 'content-type' definition. We should
    // always expect the server to respond with a type.

    if (type === null) {
      return {
        code: "INTERNAL_SERVER",
        status: response.status,
        message: "Missing 'content-type' in header returned from server.",
      };
    }

    // ### Error Response
    // If the response comes with a non successfull HTTP status we parse the response
    // as an error.

    if (response.status >= 400) {
      if (type.includes("json") === false) {
        return {
          code: "INTERNAL_SERVER",
          status: response.status,
          message: "Unsupported 'json' body returned from server, missing 'data' or 'error' key.",
        };
      }
      return this.#toError(await response.json());
    }

    // ### Empty Response
    // If the response comes back with empty response status 204 we simply return a
    // empty success.

    if (response.status === 204) {
      return null;
    }

    // ### JSON
    // If the 'content-type' contains 'json' we treat it as a 'json' compliant response
    // and attempt to resolve it as such.

    if (type.includes("json") === false) {
      return {
        code: "INTERNAL_SERVER",
        status: response.status,
        message: "Unsupported 'content-type' in header returned from server.",
      };
    }

    return response.json();
  }

  #toError(candidate: unknown, status: number = 500): ServerErrorType | ServerErrorJSON {
    if (assertServerErrorResponse(candidate)) {
      return ServerError.fromJSON(candidate);
    }
    if (typeof candidate === "string") {
      return {
        code: "INTERNAL_SERVER",
        status,
        message: candidate,
      };
    }
    return {
      code: "INTERNAL_SERVER",
      status,
      message: "Unsupported 'error' returned from server.",
    };
  }
}

function containsFile(value: unknown): boolean {
  if (value instanceof File) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.some(containsFile);
  }
  if (typeof value === "object" && value !== null) {
    return Object.values(value).some(containsFile);
  }
  return false;
}

export type HttpAdapterOptions = {
  url: string;
  hooks?: {
    beforeRequest?: ((headers: Headers) => Promise<void>)[];
  };
};
