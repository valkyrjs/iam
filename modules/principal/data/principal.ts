import z from "zod";

export enum PrincipalType {
  User = 1,
  Group = 2,
  Other = 99,
}

export const PRINCIPAL_TYPE_NAMES = {
  [PrincipalType.User]: "User",
  [PrincipalType.Group]: "Group",
  [PrincipalType.Other]: "Other",
};

/*
 |--------------------------------------------------------------------------------
 | Schema
 |--------------------------------------------------------------------------------
 */

const RolesSchema = z.array(z.string());
const AttrSchema = z.record(z.string(), z.any());
const MetaSchema = z.record(z.string(), z.any());

export const PrincipalInsertSchema = z.object({
  id: z.string(),
  type: z.enum(PrincipalType),
  roles: RolesSchema.default([]),
  attr: AttrSchema.default({}),
  meta: MetaSchema.default({}),
});

export const PrincipalSchema = z.object({
  id: z.string(),
  type: z.enum(PrincipalType),
  roles: z.string().transform((roles) => RolesSchema.parse(JSON.parse(roles))),
  attr: z.string().transform((attr) => AttrSchema.parse(JSON.parse(attr))),
  meta: z.string().transform((meta) => MetaSchema.parse(JSON.parse(meta))),
});

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

export type PrincipalInsert = z.input<typeof PrincipalInsertSchema>;
export type Principal = z.infer<typeof PrincipalSchema>;
