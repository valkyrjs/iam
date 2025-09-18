import z from "zod";

import { PrincipalProvider } from "../../libraries/principal.ts";
import { RoleSchema } from "./role.ts";

export const principal = new PrincipalProvider(
  RoleSchema,
  {
    tenantId: z.string().describe("Tenant which the principal is attached."),
  },
  function (uid: string) {
    return this.schema.parse({
      uid,
      roles: ["user"],
      attributes: {
        tenantId: "tenant-id",
      },
    });
  },
);

export type Principal = typeof principal.$principal;
