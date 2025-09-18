import { z } from "zod";

import { ResourceRegistry } from "../../libraries/resources.ts";

export const resources = new ResourceRegistry([
  {
    kind: "user",
    attributes: {
      tenantId: z.string(),
      public: z.boolean(),
    },
  },
  {
    kind: "post",
    attributes: {
      owner: z.string(),
    },
  },
] as const);

export type Resource = typeof resources.$resource;
