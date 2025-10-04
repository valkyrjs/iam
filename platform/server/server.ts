import "./types.ts";

import { context, InternalServerError } from "@platform/relay";
import { getStorageContext, storage } from "@platform/storage";

export default {
  /**
   * TODO ...
   */
  bootstrap: async (): Promise<void> => {
    Object.defineProperties(context, {
      /**
       * TODO ...
       */
      request: {
        get() {
          const request = storage.getStore()?.request;
          if (request === undefined) {
            throw new InternalServerError("Storage missing 'request' assignment.");
          }
          return request;
        },
      },

      /**
       * TODO ...
       */
      response: {
        get() {
          const response = storage.getStore()?.response;
          if (response === undefined) {
            throw new InternalServerError("Storage missing 'response' assignment.");
          }
          return response;
        },
      },

      /**
       * TODO ...
       */
      info: {
        get() {
          const info = storage.getStore()?.info;
          if (info === undefined) {
            throw new InternalServerError("Storage missing 'info' assignment.");
          }
          return info;
        },
      },
    });
  },

  /**
   * TODO ...
   */
  resolve: async (request: Request): Promise<void> => {
    const context = getStorageContext();
    context.request = {
      headers: request.headers,
    };
    context.response = {
      headers: new Headers(),
    };
    context.info = {
      method: request.url,
      start: Date.now(),
    };
  },
};
