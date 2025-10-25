import { client, type Options, takeInserted, takeOne } from "@platform/database";

import {
  type TenantPrincipal,
  type TenantPrincipalInsert,
  TenantPrincipalInsertSchema,
  TenantPrincipalSchema,
} from "../schemas/tenant-principal.ts";

/**
 * Add tenant principal to the database.
 *
 * @param principal - Principal to add.
 * @param options   - Database query options.
 */
export async function createTenantPrincipal(
  principal: TenantPrincipalInsert,
  { tx }: Options = {},
): Promise<TenantPrincipal> {
  const { tenantId, userId, name, roles, attr } = TenantPrincipalInsertSchema.parse(principal);
  return (tx ?? client)`
    INSERT INTO "tenant_principal"
      (id, "tenantId", "userId", name, roles, attr)
    VALUES
      (
        ${crypto.randomUUID()},
        ${tenantId},
        ${userId},
        ${name},
        ${roles},
        ${attr}
      )
    RETURNING *
  `.then(takeInserted("tenant_principal", TenantPrincipalSchema));
}

/**
 * Retrieve a tenant principal by given better-auth user id.
 *
 * @param userId  - User id from better-auth user.
 * @param options - Database query options.
 */
export async function getTenantPrincipalByUserId(
  userId: string,
  { tx }: Options = {},
): Promise<TenantPrincipal | undefined> {
  return (tx ?? client)`SELECT * FROM "tenant_principal" WHERE "userId" = ${userId} LIMIT 1`.then(
    takeOne(TenantPrincipalSchema),
  );
}
