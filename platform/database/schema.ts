import { client } from "./client.ts";
import { config } from "./config.ts";

export const schemaString = config.postgres.schema;

export function schema() {
  return client.unsafe(config.postgres.schema);
}
