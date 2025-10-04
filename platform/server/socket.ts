import { logger } from "@platform/logger";
import { context } from "@platform/relay";
import { storage } from "@platform/storage";
import { toJsonRpc } from "@valkyr/json-rpc";

import type { Api } from "./api.ts";

/**
 * TODO ...
 */
export function upgradeWebSocket(request: Request, _api: Api) {
  const { socket, response } = Deno.upgradeWebSocket(request);

  socket.addEventListener("open", () => {
    logger.prefix("Socket").info("socket connected", {});
    context.sockets.add(socket);
  });

  socket.addEventListener("close", () => {
    logger.prefix("Socket").info("socket disconnected", {});
    context.sockets.del(socket);
  });

  socket.addEventListener("message", (event) => {
    if (event.data === "ping") {
      return;
    }

    const message = toJsonRpc(event.data);

    logger.prefix("Socket").info(message);

    storage.run({}, async () => {
      // api
      //   .send(body)
      //   .then((response) => {
      //     if (response !== undefined) {
      //       logger.info({ response });
      //       socket.send(JSON.stringify(response));
      //     }
      //   })
      //   .catch((error) => {
      //     logger.info({ error });
      //     socket.send(JSON.stringify(error));
      //   });
    });
  });

  return response;
}
