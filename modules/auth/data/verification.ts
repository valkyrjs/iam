import z from "zod";

/*
 |--------------------------------------------------------------------------------
 | Verification Schema
 |--------------------------------------------------------------------------------
 */

export const VerificationSchema = z.object({
  id: z.string().describe("Unique identifier for each verification"),
  identifier: z.string().describe("The identifier for the verification request"),
  value: z.string().describe("The value to be verified"),
  createdAt: z.coerce.date().describe("Timestamp of when the verification request was created"),
  updatedAt: z.coerce.date().describe("Timestamp of when the verification request was updated"),
  expiresAt: z.coerce.date().describe("The time when the verification request expires"),
});

export type Verification = z.infer<typeof VerificationSchema>;

/*
 |--------------------------------------------------------------------------------
 | Database Schemas
 |--------------------------------------------------------------------------------
 */

export const VerificationInsertSchema = z.object({
  identifier: VerificationSchema.shape.identifier,
  value: VerificationSchema.shape.value,
});

export type VerificationInsert = z.input<typeof VerificationInsertSchema>;
