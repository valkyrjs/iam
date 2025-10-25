import { client, type Options, takeInserted } from "@platform/database";

import {
  type TenantInvite,
  type TenantInviteInsert,
  TenantInviteInsertSchema,
  TenantInviteSchema,
} from "../schemas/tenant-invite.ts";

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
 * import { createTenantInvite } from "@server/tenant";
 *
 * const tenant = await createTenantInvite({
 *   tenantId: "tenant-id",
 *   email: "john.doe@fixture.none",
 *   roles: ["user", "admin"],
 *   expiresAt: new Date(), // optional expiration date
 * });
 * ```
 */
export async function createTenantInvite(invite: TenantInviteInsert, { tx }: Options = {}): Promise<TenantInvite> {
  const { email, roles, expiresAt } = TenantInviteInsertSchema.parse(invite);
  return (tx ?? client)`
    INSERT INTO "tenant_invite"
      (id, email, roles, expiresAt)
    VALUES
      (
        ${crypto.randomUUID()},
        ${email},
        ${roles},
        ${expiresAt?.toISOString() ?? null}
      )
    RETURNING *
  `.then(takeInserted("tenant_invite", TenantInviteSchema));
}
