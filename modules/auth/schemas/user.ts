import { z } from "zod";

/*
 |--------------------------------------------------------------------------------
 | User Schema
 |--------------------------------------------------------------------------------
 */

export const UserSchema = z.object({
  id: z.string().describe("Unique identifier for each user"),
  name: z.string().describe("User's chosen display name"),
  email: z.email().describe("User's email address for communication and login"),
  emailVerified: z.boolean().describe("Whether the user's email is verified"),
  image: z.url().nullable().optional().describe("User's image url"),
  createdAt: z.coerce.date().describe("Timestamp of when the user account was created"),
  updatedAt: z.coerce.date().describe("Timestamp of the last update to the user's information"),
});

export type User = z.output<typeof UserSchema>;

/*
 |--------------------------------------------------------------------------------
 | Database Schemas
 |--------------------------------------------------------------------------------
 */

export const UserInsertSchema = z.object({
  email: UserSchema.shape.email,
});

export type UserInsert = z.input<typeof UserInsertSchema>;
