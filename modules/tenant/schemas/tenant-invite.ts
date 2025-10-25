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
  roles: z.array(z.string()).describe("The roles to assign to the principal."),
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
  tenantId: TenantInviteSchema.shape.tenantId,
  email: TenantInviteSchema.shape.email,
  roles: TenantInviteSchema.shape.roles.default([]),
  expiresAt: z.date().optional().describe("How long the invite is valid for, never expires when omitted."),
});

export type TenantInviteInsert = z.input<typeof TenantInviteInsertSchema>;
