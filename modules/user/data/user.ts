import { z } from "zod";

import { Contacts } from "./value-objects/contact.ts";
import { NameSchema, UserName } from "./value-objects/name.ts";

/*
 |--------------------------------------------------------------------------------
 | Schemas
 |--------------------------------------------------------------------------------
 */

export const UserInsertSchema = z.object({
  name: NameSchema,
  email: z.string(),
});

export const UserSchema = UserInsertSchema.extend({
  id: z.string(),
  name: z.string().transform((name) => new UserName(JSON.parse(name))),
  contacts: z.string().transform((contacts) => new Contacts(JSON.parse(contacts))),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

export type UserInsert = z.input<typeof UserInsertSchema>;
export type User = z.infer<typeof UserSchema>;
