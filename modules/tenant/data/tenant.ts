import z from "zod";

/*
 |--------------------------------------------------------------------------------
 | Schema
 |--------------------------------------------------------------------------------
 */

const MetaSchema = z.record(z.string(), z.any());

export const TenantInsertSchema = z.object({
  name: z.string(),
  slug: z.string(),
  meta: MetaSchema.default({}),
});

export const TenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  meta: z.string().transform((meta) => MetaSchema.parse(JSON.parse(meta))),
  createdAt: z.coerce.date(),
});

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

export type TenantInsert = z.input<typeof TenantInsertSchema>;
export type Tenant = z.infer<typeof TenantSchema>;
