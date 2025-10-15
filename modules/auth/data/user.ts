import { z } from "zod";

import { NameSchema, UserName } from "./value-objects/name.ts";

/*
 |--------------------------------------------------------------------------------
 | Schemas
 |--------------------------------------------------------------------------------
 */

export const UserInsertSchema = z.object({
  tenantId: z.string(),
  name: NameSchema,
  email: z.string(),
});

export const UserSchema = UserInsertSchema.extend({
  id: z.string(),
  tenantId: z.string(),
  name: z.string().transform((name) => new UserName(JSON.parse(name))),
  email: z.string(),
  emailVerified: z.boolean(),
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
