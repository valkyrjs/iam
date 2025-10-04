import { getEnvironmentVariable } from "@platform/config/environment.ts";
import z from "zod";

export const config = {
  level: getEnvironmentVariable({
    key: "LOG_LEVEL",
    type: z.string(),
    fallback: "info",
    envFallback: {
      local: "debug",
    },
  }),
};
