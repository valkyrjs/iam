import { client, type Options, schema, takeInserted } from "@platform/database";

import { type User, type UserInsert, UserInsertSchema, UserSchema } from "./user.ts";

/**
 * Add a user to the database.
 *
 * @param user    - User to add.
 * @param options - Database query options.
 */
export async function createUser(user: UserInsert, { tx }: Options = {}): Promise<User> {
  const { name, email } = UserInsertSchema.parse(user);
  return (tx ?? client)`
    INSERT INTO ${schema()}."user" 
      (id, name, email, "emailVerified", contacts, "createdAt", "updatedAt") 
    VALUES 
      (
        ${crypto.randomUUID()},
        ${JSON.stringify(name)},
        ${email},
        ${false},
        ${JSON.stringify([
          {
            type: "email",
            value: email,
            primary: true,
          },
        ])},
        ${new Date()},
        ${new Date()}
      ) 
    RETURNING *
  `.then(takeInserted("user", UserSchema));
}
