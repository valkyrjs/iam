import { assertObjectMatch } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import z from "zod";

import { ResourceRegistry } from "../libraries/resources.ts";

describe("Resources", () => {
  it("should create a functional registry", () => {
    const resources = new ResourceRegistry([
      {
        kind: "user",
        attr: {
          public: z.boolean(),
        },
        actions: ["read"],
      },
    ] as const);

    const id = crypto.randomUUID();

    assertObjectMatch(resources.parse("user", id, { public: true }), {
      kind: "user",
      id,
      attr: {
        public: true,
      },
    });
  });
});
