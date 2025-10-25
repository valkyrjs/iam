import { z } from "zod";

/*
 |--------------------------------------------------------------------------------
 | Session Schema
 |--------------------------------------------------------------------------------
 */

export const SessionSchema = z.strictObject({
  id: z.string().describe("Unique identifier for each session"),

  tenantId: z.string().describe("The ID of the tenant"),
  userId: z.string().describe("The ID of the user"),

  token: z.string().describe("The unique session token"),

  ipAddress: z.string().nullable().optional().describe("The IP address of the device"),
  userAgent: z.string().nullable().optional().describe("The user agent information of the device"),

  createdAt: z.coerce.date().describe("Timestamp of when the session was created"),
  updatedAt: z.coerce.date().describe("Timestamp of when the session was updated"),
  expiresAt: z.coerce.date().describe("The time when the session expires"),
});

export type Session = z.infer<typeof SessionSchema>;
