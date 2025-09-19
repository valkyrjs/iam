import { z } from "zod";

import { ResourceRegistry } from "../../libraries/resources.ts";

export const resources = new ResourceRegistry([
  {
    kind: "user",
    attr: {
      tenantId: z.string(),
      public: z.boolean(),
    },
  },
  {
    kind: "post",
    attr: {
      owner: z.string(),
    },
  },
] as const);

export type Resource = typeof resources.$resource;
