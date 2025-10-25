import { client, type Options, takeInserted, takeOne } from "@platform/database";

import { type Tenant, type TenantInsert, TenantInsertSchema, TenantSchema } from "../schemas/tenant.ts";

/**
 * Add tenant to the database.
 *
 * @param tenant  - Tenant to add.
 * @param options - Database query options.
 *
 * @throws new DatabaseInsertError("tenant") if no response from database RETURNING
 *
 * @example
 * ```ts
 * import { createTenant } from "@server/tenant";
 *
 * const tenant = await createTenant({
 *   name: "Valkyr",
 *   slug: "valkyr",
 *   meta: {
 *     foo: "bar" // free form meta data to attach to the tenant
 *   }
 * });
 * ```
 */
export async function createTenant(principal: TenantInsert, { tx }: Options = {}): Promise<Tenant> {
  const { name, slug, meta } = TenantInsertSchema.parse(principal);
  return (tx ?? client)`
    INSERT INTO "tenant"
      (id, name, slug, meta)
    VALUES
      (
        ${crypto.randomUUID()},
        ${name},
        ${slug},
        ${meta}
      )
    RETURNING *
  `.then(takeInserted("tenant", TenantSchema));
}

/**
 * Get tenant by its unique identifier.
 *
 * @param tenantId - Tenant id to retrieve.
 * @param options  - Database query options.
 *
 * @example
 * ```ts
 * import { getTenantById } from "@server/tenant";
 *
 * const tenant = await getTenantById("tenant-id");
 * // Tenant | undefined
 * ```
 */
export async function getTenantById(tenantId: string, { tx }: Options = {}): Promise<Tenant | undefined> {
  return (tx ?? client)`SELECT * FROM tenant WHERE id = ${tenantId} LIMIT 1`.then(takeOne(TenantSchema));
}

/**
 * Get tenant the provided user belongs to.
 *
 * @param userId  - User to retrieve tenant for.
 * @param options - Database query options.
 *
 * @example
 * ```ts
 * import { getTenantUserById } from "@server/tenant";
 *
 * const tenant = await getTenantByUserId("user-id");
 * if (tenant === undefined) {
 *   throw new NotFoundError("Tenant not found");
 * }
 * ```
 */
export async function getTenantByUserId(userId: string, { tx }: Options = {}) {
  return (tx ?? client)`
    SELECT t.*
    FROM "tenant" AS t
    INNER JOIN "tenant_principal" AS tp
    ON t.id = tp."tenantId"
    WHERE tp."userId" = ${userId}
    LIMIT 1
  `.then(takeOne(TenantSchema));
}
