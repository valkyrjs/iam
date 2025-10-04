import { client, type Options, schema, takeInserted } from "@platform/database";

import { type User, type UserInsert, UserInsertSchema, UserSchema } from "./user.ts";

/**
 * Add a user to the database.
 *
 * @param user    - User to add.
 * @param options - Database query options.
 */
export async function createUser(user: UserInsert, { tx }: Options = {}): Promise<User> {
  const { name, contacts } = UserInsertSchema.parse(user);
  return (tx ?? client)`
    INSERT INTO ${schema()}."user" 
      (id, "tenantId", name, contacts, "createdAt", "updatedAt") 
    VALUES 
      (
        ${crypto.randomUUID()},
        ${user.tenantId},
        ${JSON.stringify(name)},
        ${JSON.stringify(contacts)},
        ${new Date()},
        ${new Date()}
      ) 
    RETURNING *
  `.then(takeInserted("user", UserSchema));
}
