import auth from "@modules/auth";
import tenant from "@modules/tenant";
import { logger } from "@platform/logger";
import { Api } from "@platform/server";

import { config } from "./config.ts";

const log = logger.prefix("Server");

/*
 |--------------------------------------------------------------------------------
 | Bootstrap
 |--------------------------------------------------------------------------------
 */

await auth.bootstrap();

/*
 |--------------------------------------------------------------------------------
 | Service
 |--------------------------------------------------------------------------------
 */

const api = new Api([...(await auth.routes()), ...(await tenant.routes())]);

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
    const url = new URL(request.url);

    // ### Request Context
    // Resolve request context for all dependent modules.

    await auth.resolve(request);

    // ### Start

    const start = Date.now();

    // ### Fetch
    // Execute fetch against the api instance.

    return api.fetch(request).finally(() => {
      log.info(`${request.method} ${url.pathname} [${((Date.now() - start) / 1000).toLocaleString()} seconds]`);
    });
  },
);
