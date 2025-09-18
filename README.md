<p align="center">
  <img src="https://user-images.githubusercontent.com/1998130/229430454-ca0f2811-d874-4314-b13d-c558de8eec7e.svg" />
</p>

# Auth

Authentication and Access Control solution for full-stack TypeScript applications.

Provides:

* Strongly-typed **Principal** management (roles + attributes).
* **Resource registry** with type-safe schemas.
* Flexible **Access Control Providers**.

---

## Quick Start

### Principal

A `PrincipalProvider` defines the roles, attributes, and resolution logic for authenticated users or services.

```ts
import z from "zod";
import { PrincipalProvider } from "@valkyr/auth";

const RolesSchema = z.union([z.literal("user"), z.literal("admin")]);
const AttributesSchema = {
  tenantId: z.string().describe("Tenant which the principal is attached."),
};

export const principal = new PrincipalProvider(
  RolesSchema,
  AttributesSchema,
  function (uid: string) {
    return this.schema.parse({
      uid,
      roles: ["user"], // dynamically fetch or compute roles here
      attributes: {
        tenantId: "tenant-id",
      },
    });
  },
);

export type Principal = typeof principal.$principal;
```

> The resolver function can be synchronous or asynchronous, fetching roles/attributes from a database, API, or directory.

---

### Resources

Define all resources in your application using a `ResourceRegistry`. Each resource has a `kind` and a type-safe attribute schema.

```ts
import { z } from "zod";
import { ResourceRegistry } from "@valkyr/auth";

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
```

---

### Access Control

Access control providers define the permission logic for a principal.

```ts
import type { Principal } from "./principal.ts";

export function access(principal: Principal) {
  return {
    isAllowed(tenantId: string): boolean {
      return principal.attributes.tenantId === tenantId;
    },
  };
}
```

> You can implement more complex logic, including role-based checks or multi-resource validation.

---

### Auth

Instantiate the `Auth` system with your principal, resources, access control provider, and JWT settings.

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Auth } from "@valkyr/auth";

import { access } from "./access.ts";
import { principal } from "./principal.ts";
import { resources } from "./resources.ts";

export const auth = new Auth({
  principal,
  resources,
  access,
  settings: {
    algorithm: "RS256",
    privateKey: readFileSync(join(import.meta.dirname!, "keys", "private"), "utf-8"),
    publicKey: readFileSync(join(import.meta.dirname!, "keys", "public"), "utf-8"),
    issuer: "https://valkyrjs.com",
    audience: "https://valkyrjs.com",
  },
});
```

---

### Generate a Session

```ts
import { auth } from "./auth.ts";

const token = await auth.generate({ uid: "xyz" });
```

---

### Resolve a Session

Resolve a session, check access, and execute guards.

```ts
import { auth } from "./auth.ts";

const session = await auth.resolve("token");

if (!session.valid) {
  throw new Error(session.message);
}

if (!session.access.isAllowed("tenant-id")) {
  throw new Error("Not allowed to update accounts");
}
```

> This ensures that only principals with the correct roles and attributes can perform actions on the resources.
