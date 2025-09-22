import { z } from "zod";

import { ResourceRegistry } from "../../libraries/resources.ts";

export const resources = new ResourceRegistry([
  {
    kind: "user",
    attr: {
      tenantId: z.string(),
      public: z.boolean(),
    },
    actions: ["read", "update", "delete"],
  },
  {
    kind: "post",
    attr: {
      tenantId: z.string(),
      owner: z.string(),
    },
    actions: ["create", "read"],
  },
] as const);

export type Resource = typeof resources.$resource;

export type Action = typeof resources.$action;
