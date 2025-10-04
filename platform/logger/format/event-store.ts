import { EventValidationError } from "@valkyr/event-store";

import type { Level } from "../level.ts";
import { getTracedAt } from "../stack.ts";

export function toEventStoreLog(arg: any, level: Level): any {
  if (arg instanceof EventValidationError) {
    const obj: any = {
      origin: "EventStore",
      message: arg.message,
      at: getTracedAt(arg.stack, "/api/domains"),
      data: arg.errors,
    };
    if (level === "debug") {
      obj.stack = arg.stack;
    }
    return obj;
  }
}
