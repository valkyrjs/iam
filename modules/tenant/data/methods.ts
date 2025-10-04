import { client, type Options, schema, takeInserted } from "@platform/database";

import { type Tenant, TenantSchema } from "./tenant.ts";

/**
 * Create new tenant.
 *
 * @param options - Database query options.
 */
export async function createTenant({ tx }: Options = {}): Promise<Tenant> {
  return (tx ?? client)`
    INSERT INTO ${schema()}."tenant" (id) VALUES (${crypto.randomUUID()}) RETURNING *
  `.then(takeInserted("tenant", TenantSchema));
}
