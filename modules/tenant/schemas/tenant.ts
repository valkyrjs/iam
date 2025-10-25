import { ZodJSONB } from "@platform/utilities";
import z from "zod";

const MetaSchema = ZodJSONB(z.record(z.string(), z.any()).default({}).describe("Tenant's dynamic meta data"));

/*
 |--------------------------------------------------------------------------------
 | Tenant Schema
 |--------------------------------------------------------------------------------
 */

export const TenantSchema = z.object({
  id: z.string().describe("Unique identifier for each tenant"),
  name: z.string().describe("Tenant's chosen name"),
  slug: z.string().toLowerCase().describe("Tenant's chosen search string"),
  meta: MetaSchema.read,
  createdAt: z.coerce.date().describe("Timestamp of when the tenant was created"),
});

export type Tenant = z.output<typeof TenantSchema>;

/*
 |--------------------------------------------------------------------------------
 | Database Schema
 |--------------------------------------------------------------------------------
 */

export const TenantInsertSchema = z.object({
  name: TenantSchema.shape.name,
  slug: TenantSchema.shape.slug,
  meta: MetaSchema.write,
});

export type TenantInsert = z.input<typeof TenantInsertSchema>;
