import { TenantSchema } from "@modules/tenant";
import { client, type Options, takeInserted } from "@platform/database";

import { type Tenant, type TenantInsert, TenantInsertSchema } from "./tenant.ts";

/**
 * Add tenant to the database.
 *
 * @param tenant  - Tenant to add.
 * @param options - Database query options.
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
        ${JSON.stringify(meta)}
      )
    RETURNING *
  `.then(takeInserted("tenant", TenantSchema));
}
