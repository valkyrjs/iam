import { RequestContextMissingError, storage } from "@platform/request";

export * from "./libraries/api.ts";
export * from "./libraries/route.ts";

/*
 |--------------------------------------------------------------------------------
 | Module
 |--------------------------------------------------------------------------------
 */

export default {
  context: {
    get headers() {
      const headers = storage.getStore()?.headers;
      if (headers === undefined) {
        throw new RequestContextMissingError("headers");
      }
      return headers;
    },

    get url() {
      const url = storage.getStore()?.url;
      if (url === undefined) {
        throw new RequestContextMissingError("url");
      }
      return url;
    },
  },

  storage: async (request: Request): Promise<HttpRequestContext> => {
    return {
      headers: request.headers,
      url: new URL(request.url),
    };
  },
};

/*
 |--------------------------------------------------------------------------------
 | Request
 |--------------------------------------------------------------------------------
 */

type HttpRequestContext = {
  /**
   * HTTP headers for the incoming request.
   */
  headers: Headers;

  /**
   * The full URL of the incoming request.
   */
  url: URL;
};

/*
 |--------------------------------------------------------------------------------
 | Declare
 |--------------------------------------------------------------------------------
 */

declare module "@platform/request" {
  interface RequestStorage extends HttpRequestContext {}
  interface RequestContext extends HttpRequestContext {}
}
