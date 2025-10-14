import z from "zod";

/*
 |--------------------------------------------------------------------------------
 | Schema
 |--------------------------------------------------------------------------------
 */

export const VerificationInsertSchema = z.object({
  identifier: z.string(),
  value: z.string(),
});

export const VerificationSchema = z.object({
  id: z.string(),
  identifier: z.string(),
  value: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  expiresAt: z.coerce.date(),
});

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

export type VerificationInsert = z.input<typeof VerificationInsertSchema>;
export type Verification = z.infer<typeof VerificationSchema>;
