import { getTenantByUserId } from "@modules/tenant";
import { connectionString } from "@platform/database";
import type { BetterAuthOptions } from "better-auth";
import { Pool } from "pg";

export default {
  database: new Pool({
    connectionString,
  }),
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const tenant = await getTenantByUserId(session.userId);
          if (tenant === undefined) {
            return false;
          }
          return {
            data: {
              ...session,
              tenantId: tenant.id,
            },
          };
        },
      },
    },
  },
} satisfies BetterAuthOptions;
