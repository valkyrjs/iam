import postgres, { type TransactionSql } from "postgres";

import { config } from "./config.ts";

/*
 |--------------------------------------------------------------------------------
 | Clients
 |--------------------------------------------------------------------------------
 */

export const client = postgres({
  host: config.postgres.host,
  port: config.postgres.port,
  user: config.postgres.user,
  password: config.postgres.pass,
  database: config.postgres.name,
  max: config.postgres.maxPool,
  onnotice: () => {},
});

export const connectionString = `postgres://${config.postgres.user}:${config.postgres.pass}@${config.postgres.host}:${config.postgres.port}/${config.postgres.name}`;

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

export type Options = {
  tx?: TransactionSql;
};
