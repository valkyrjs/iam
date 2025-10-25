import { toEventStoreLog } from "./libraries/format/event-store.ts";
import { toServerLog } from "./libraries/format/server.ts";
import { Logger } from "./libraries/logger.ts";

export const logger = new Logger({
  loggers: [toServerLog, toEventStoreLog],
});
