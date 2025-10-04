import { client, type Options, schema, takeInserted } from "@platform/database";

import {
  type Verification,
  type VerificationInsert,
  VerificationInsertSchema,
  VerificationSchema,
} from "./verification.ts";

/**
 * Create new verification entry.
 *
 * @param verification - Verification details.
 * @param options      - Database query options.
 */
export async function createVeficication(
  verification: VerificationInsert,
  { tx }: Options = {},
): Promise<Verification> {
  const { tenantId, identifier, value } = VerificationInsertSchema.parse(verification);
  return (tx ?? client)`
    INSERT INTO ${schema()}."verification" 
      ("tenantId", identifier, value)
    VALUES 
      (
        ${tenantId},
        ${identifier},
        ${value}
      )
    RETURNING *
  `.then(takeInserted("verification", VerificationSchema));
}
