import { NameSchema, UserName } from "@platform/value-object";
import z from "zod";

const RolesSchema = z.array(z.string()).describe("List of roles assigned to the principal.");
const AttrSchema = z.record(z.string(), z.any()).describe("Attribute map assigned to the principal.");

/*
 |--------------------------------------------------------------------------------
 | Tenant Principal Schema
 |--------------------------------------------------------------------------------
 */

export const TenantPrincipalSchema = z.object({
  id: z.string().describe("Unique ID the principal is assigned."),

  tenantId: z.string().describe("Tenant ID the principal belongs to."),
  userId: z.string().describe("User ID the principal belongs to."),

  name: z.string().transform((name) => UserName.create(JSON.parse(name))),

  roles: z.string().transform((roles) => RolesSchema.parse(JSON.parse(roles))),
  attr: z.string().transform((attr) => AttrSchema.parse(JSON.parse(attr))),

  createdAt: z.coerce.date().describe("Creation date of the principal."),
});

export type TenantPrincipal = z.infer<typeof TenantPrincipalSchema>;

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
  name: NameSchema,
  roles: RolesSchema.default([]),
  attr: AttrSchema.default({}),
});

export type TenantPrincipalInsert = z.input<typeof TenantPrincipalInsertSchema>;
