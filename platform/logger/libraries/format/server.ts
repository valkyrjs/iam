import { ServerError } from "@platform/relay";

import type { Level } from "../level.ts";
import { getTracedAt } from "../stack.ts";

export function toServerLog(arg: any, level: Level): any {
  if (arg instanceof ServerError) {
    const obj: any = {
      message: arg.message,
      data: arg.data,
      at: getTracedAt(arg.stack, "/api/domains"),
    };
    if (level === "debug") {
      obj.stack = arg.stack;
    }
    return obj;
  }
}
