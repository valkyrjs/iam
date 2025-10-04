import { getEnvironmentVariable } from "@platform/config";
import z from "zod";

export const config = {
  docker: {
    postgres: "postgres:14.11-alpine3.19",
  },
  postgres: {
    host: getEnvironmentVariable({
      key: "IAM_PG_HOST",
      type: z.string(),
      fallback: "localhost",
    }),
    port: getEnvironmentVariable({
      key: "IAM_PG_PORT",
      type: z.coerce.number(),
      fallback: "5432",
    }),
    user: getEnvironmentVariable({
      key: "IAM_PG_USER",
      type: z.string(),
      fallback: "postgres",
    }),
    pass: getEnvironmentVariable({
      key: "IAM_PG_PASS",
      type: z.string(),
      fallback: "postgres",
    }),
    name: getEnvironmentVariable({
      key: "IAM_PG_NAME",
      type: z.string(),
      fallback: "iam",
    }),
    schema: getEnvironmentVariable({
      key: "IAM_PG_SCHEMA",
      type: z.string(),
      fallback: "public",
    }),
    maxPool: getEnvironmentVariable({
      key: "IAM_PG_MAX_POOL",
      type: z.coerce.number(),
      fallback: "10",
    }),
  },
};
