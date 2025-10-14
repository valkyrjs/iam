import { getEnvironmentVariable } from "@platform/config";
import z from "zod";

export const config = {
  name: "@valkyr/boilerplate",
  host: getEnvironmentVariable({ key: "API_HOST", type: z.ipv4(), fallback: "0.0.0.0" }),
  port: getEnvironmentVariable({
    key: "API_PORT",
    type: z.coerce.number(),
    fallback: "8370",
  }),
};
