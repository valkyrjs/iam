import { client, type Options, takeInserted } from "@platform/database";

import { type User, type UserInsert, UserInsertSchema, UserSchema } from "../schemas/user.ts";

/**
 * Add a user to the database.
 *
 * @param user    - User to add.
 * @param options - Database query options.
 */
export async function createUser(user: UserInsert, { tx }: Options = {}): Promise<User> {
  const { email } = UserInsertSchema.parse(user);
  return (tx ?? client)`
    INSERT INTO "user" 
      (id, email, "emailVerified", "createdAt", "updatedAt") 
    VALUES 
      (
        ${crypto.randomUUID()},
        ${email},
        ${false},
        ${new Date()},
        ${new Date()}
      ) 
    RETURNING *
  `.then(takeInserted("user", UserSchema));
}
