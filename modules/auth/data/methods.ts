import { client, type Options, takeInserted } from "@platform/database";

import { type User, type UserInsert, UserInsertSchema, UserSchema } from "./user.ts";
import {
  type Verification,
  type VerificationInsert,
  VerificationInsertSchema,
  VerificationSchema,
} from "./verification.ts";

/**
 * Add a user to the database.
 *
 * @param user    - User to add.
 * @param options - Database query options.
 */
export async function createUser(user: UserInsert, { tx }: Options = {}): Promise<User> {
  const { tenantId, name, email } = UserInsertSchema.parse(user);
  return (tx ?? client)`
    INSERT INTO "user" 
      (id, "tenantId", name, email, "emailVerified", "createdAt", "updatedAt") 
    VALUES 
      (
        ${crypto.randomUUID()},
        ${tenantId},
        ${JSON.stringify(name)},
        ${email},
        ${false},
        ${new Date()},
        ${new Date()}
      ) 
    RETURNING *
  `.then(takeInserted("user", UserSchema));
}

/**
 * Create new verification entry.
 *
 * @param verification - Verification details.
 * @param options      - Database query options.
 */
export async function createVerification(
  verification: VerificationInsert,
  { tx }: Options = {},
): Promise<Verification> {
  const { identifier, value } = VerificationInsertSchema.parse(verification);
  return (tx ?? client)`
    INSERT INTO "verification" 
      (identifier, value)
    VALUES 
      (
        ${identifier},
        ${value}
      )
    RETURNING *
  `.then(takeInserted("verification", VerificationSchema));
}
