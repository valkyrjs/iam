import z from "zod";

/*
 |--------------------------------------------------------------------------------
 | Tenant Invite Schema
 |--------------------------------------------------------------------------------
 */

export const TenantInviteSchema = z.object({
  id: z.string().describe("Unique ID of the invitation."),
  tenantId: z.string().describe("Tenant ID to assign the user to."),
  email: z.email().describe("Email of the user to invite."),
  createdAt: z.coerce.date().describe("Date the invite was created."),
  expiresAt: z.coerce.date().nullable().describe("How long the invite is valid for, never expires when omitted."),
});

export type TenantInvite = z.infer<typeof TenantInviteSchema>;

/*
 |--------------------------------------------------------------------------------
 | Database Schemas
 |--------------------------------------------------------------------------------
 */

export const TenantInviteInsertSchema = z.object({
  tenantId: z.string().describe("Tenant ID to assign the user to."),
  email: z.email().describe("Email of the user to invite."),
  expiresAt: z.date().nullable().describe("How long the invite is valid for, never expires when omitted."),
});

export type TenantInviteInsert = z.input<typeof TenantInviteInsertSchema>;
