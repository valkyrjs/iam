import { z } from "zod";

import { ContactSchema, Contacts } from "./value-objects/contact.ts";
import { NameSchema, UserName } from "./value-objects/name.ts";

/*
 |--------------------------------------------------------------------------------
 | Schemas
 |--------------------------------------------------------------------------------
 */

export const UserInsertSchema = z.object({
  tenantId: z.string(),
  name: NameSchema,
  contacts: z.array(ContactSchema).min(1),
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
