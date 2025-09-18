import z from "zod";

export const RoleSchema = z.union([z.literal("user"), z.literal("admin")]);

export type Role = z.infer<typeof RoleSchema>;
