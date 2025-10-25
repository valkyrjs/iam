import { ZodJSONB } from "@platform/utilities";
import { NameSchema } from "@platform/value-object";
import z from "zod";

const RolesSchema = z.array(z.string()).describe("List of roles assigned to the principal.");
const AttrSchema = ZodJSONB(z.record(z.string(), z.any()).describe("Attribute map assigned to the principal."));

/*
 |--------------------------------------------------------------------------------
 | Tenant Principal Schema
 |--------------------------------------------------------------------------------
 */

export const TenantPrincipalSchema = z.object({
  id: z.string().describe("Unique ID the principal is assigned."),

  tenantId: z.string().describe("Tenant ID the principal belongs to."),
  userId: z.string().describe("User ID the principal belongs to."),

  name: NameSchema.read,

  roles: RolesSchema,
  attr: AttrSchema.read,

  createdAt: z.coerce.date().describe("Creation date of the principal."),
});

export type TenantPrincipal = z.output<typeof TenantPrincipalSchema>;

/*
 |--------------------------------------------------------------------------------
 | Database Schemas
 |--------------------------------------------------------------------------------
 */

export const TenantPrincipalInsertSchema = TenantPrincipalSchema.omit({
  id: true,
  name: true,
  roles: true,
  attr: true,
  createdAt: true,
}).extend({
  name: NameSchema.write,
  roles: RolesSchema.default([]),
  attr: AttrSchema.write,
});

export type TenantPrincipalInsert = z.input<typeof TenantPrincipalInsertSchema>;
