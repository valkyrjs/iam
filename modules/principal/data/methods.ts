import { client, type Options, schema, takeInserted, takeOne } from "@platform/database";

import { type Principal, type PrincipalInsert, PrincipalInsertSchema, PrincipalSchema } from "./principal.ts";

/**
 * Add principal to the database.
 *
 * @param principal - Principal to add.
 * @param options   - Database query options.
 */
export async function createPrincipal(principal: PrincipalInsert, { tx }: Options = {}): Promise<Principal> {
  const { type, roles, attr, meta } = PrincipalInsertSchema.parse(principal);
  return (tx ?? client)`
    INSERT INTO ${schema()}."principal"
      (id, type, roles, attr, meta)
    VALUES
      (
        ${crypto.randomUUID()},
        ${type},
        ${JSON.stringify(roles)},
        ${JSON.stringify(attr)},
        ${JSON.stringify(meta)}
      )
    RETURNING *
  `.then(takeInserted("principal", PrincipalSchema));
}

/**
 * Retrieve a principal by given better-auth user id.
 *
 * @param userId  - User id from better-auth user.
 * @param options - Database query options.
 */
export async function getPrincipalByUserId(userId: string, { tx }: Options = {}): Promise<Principal | undefined> {
  return (tx ?? client)`SELECT * FROM ${schema()}."principal" WHERE id = ${userId} LIMIT 1`.then(
    takeOne(PrincipalInsertSchema),
  );
}
