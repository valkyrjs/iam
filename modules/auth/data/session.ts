import { z } from "zod";

export const SessionSchema = z.strictObject({
  id: z.string(),
  tenantId: z.string(),
  userId: z.string(),
  token: z.string(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  expiresAt: z.coerce.date(),
});

export type Session = z.infer<typeof SessionSchema>;
