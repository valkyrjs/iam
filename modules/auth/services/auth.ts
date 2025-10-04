import { connectionString, schemaString } from "@platform/database";
import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
  database: new Pool({
    connectionString,
  }),
  account: {
    modelName: `${schemaString}.account`,
  },
  verification: {
    modelName: `${schemaString}.verification`,
  },
  user: {
    modelName: `${schemaString}.user`,
  },
  session: {
    modelName: `${schemaString}.session`,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache duration in seconds
    },
  },
});
