import "@platform/relay";
import "@platform/storage";

declare module "@platform/storage" {
  interface StorageContext {
    /**
     * TODO ...
     */
    request?: {
      headers: Headers;
    };

    /**
     * TODO ...
     */
    response?: {
      headers: Headers;
    };

    /**
     * TODO ...
     */
    info?: {
      method: string;
      start: number;
      end?: number;
    };
  }
}

declare module "@platform/relay" {
  interface ServerContext {
    request: {
      headers: Headers;
    };
    response: {
      headers: Headers;
    };
    info: {
      method: string;
      start: number;
      end?: number;
    };
  }
}
