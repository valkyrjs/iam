import { readFileSync } from "node:fs";
import { join } from "node:path";

import { Auth } from "../../libraries/auth.ts";
import { access } from "./access.ts";
import { principal } from "./principal.ts";
import { resources } from "./resources.ts";

export const auth = new Auth({
  principal,
  resources,
  access,
  jwt: {
    algorithm: "RS256",
    privateKey: readFileSync(
      join(import.meta.dirname!, "keys", "private"),
      "utf-8",
    ),
    publicKey: readFileSync(
      join(import.meta.dirname!, "keys", "public"),
      "utf-8",
    ),
    issuer: "https://valkyrjs.com",
    audience: "https://valkyrjs.com",
  },
});

export type Session = typeof auth.$session;
