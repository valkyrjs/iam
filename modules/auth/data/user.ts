import { z } from "zod";

/*
 |--------------------------------------------------------------------------------
 | User Schema
 |--------------------------------------------------------------------------------
 */

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type User = z.infer<typeof UserSchema>;

/*
 |--------------------------------------------------------------------------------
 | Database Schemas
 |--------------------------------------------------------------------------------
 */

export const UserInsertSchema = z.object({
  email: z.string(),
});

export type UserInsert = z.input<typeof UserInsertSchema>;
