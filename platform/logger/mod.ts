import { toEventStoreLog } from "./format/event-store.ts";
import { toServerLog } from "./format/server.ts";
import { Logger } from "./logger.ts";

export const logger = new Logger({
  loggers: [toServerLog, toEventStoreLog],
});
