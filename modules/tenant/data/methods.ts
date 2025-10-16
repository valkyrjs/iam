import { TenantSchema } from "@modules/tenant";
import { client, type Options, takeInserted, takeOne } from "@platform/database";

import { type Tenant, type TenantInsert, TenantInsertSchema } from "./tenant.ts";
import {
  type TenantInvite,
  type TenantInviteInsert,
  TenantInviteInsertSchema,
  TenantInviteSchema,
} from "./tenant-invite.ts";
import {
  type TenantPrincipal,
  type TenantPrincipalInsert,
  TenantPrincipalInsertSchema,
  TenantPrincipalSchema,
} from "./tenant-principal.ts";

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
 * import { createTenant } from "@module/tenant";
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
 * import { getTenantById } from "@module/tenant";
 *
 * const tenant = await getTenantById("tenant-id");
 * // Tenant | undefined
 * ```
 */
export async function getTenantById(tenantId: string, { tx }: Options = {}): Promise<Tenant | undefined> {
  return (tx ?? client)`SELECT * FROM tenant WHERE id = ${tenantId} LIMIT 1`.then(takeOne(TenantSchema));
}

/**
 * Create a tenant invite.
 *
 * @throws new DatabaseInsertError("tenant") if no response from database RETURNING
 *
 * @param invite  - Invite to create.
 * @param options - Database query options.
 *
 * @example
 * ```ts
 * import { createTenantInvite } from "@module/tenant";
 *
 * const tenant = await createTenantInvite({
 *   tenantId: "tenant-id",
 *   email: "john.doe@fixture.none",
 *   expiresAt: new Date(), // optional expiration date
 * });
 * ```
 */
export async function createTenantInvite(invite: TenantInviteInsert, { tx }: Options = {}): Promise<TenantInvite> {
  const { email, expiresAt } = TenantInviteInsertSchema.parse(invite);
  return (tx ?? client)`
    INSERT INTO "tenant"
      (id, email, expiresAt)
    VALUES
      (
        ${crypto.randomUUID()},
        ${email},
        ${expiresAt},
      )
    RETURNING *
  `.then(takeInserted("tenant_invite", TenantInviteSchema));
}

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
        ${JSON.stringify(name)},
        ${JSON.stringify(roles)},
        ${JSON.stringify(attr)}
      )
    RETURNING *
  `.then(takeInserted("tenant_principal", TenantPrincipalSchema));
}

/**
 * Get tenant the provided user belongs to.
 *
 * @param userId  - User to retrieve tenant for.
 * @param options - Database query options.
 *
 * @example
 * ```ts
 * import { getTenantUserById } from "@module/tenant";
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
