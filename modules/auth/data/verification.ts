import z from "zod";

/*
 |--------------------------------------------------------------------------------
 | Verification Schema
 |--------------------------------------------------------------------------------
 */

export const VerificationSchema = z.object({
  id: z.string(),
  identifier: z.string(),
  value: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  expiresAt: z.coerce.date(),
});

export type Verification = z.infer<typeof VerificationSchema>;

/*
 |--------------------------------------------------------------------------------
 | Database Schemas
 |--------------------------------------------------------------------------------
 */

export const VerificationInsertSchema = z.object({
  identifier: z.string(),
  value: z.string(),
});

export type VerificationInsert = z.input<typeof VerificationInsertSchema>;
