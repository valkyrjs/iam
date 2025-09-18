import { assertEquals, assertNotEquals, assertObjectMatch } from "@std/assert";
import { describe, it } from "@std/testing/bdd";

import { auth } from "./mocks/auth.ts";

describe("Auth", () => {
  it("should sign a session", async () => {
    const token = await auth.generate({ id: "abc" });

    assertNotEquals(token, undefined);
  });

  it("should resolve a session", async () => {
    const token = await auth.generate({ id: "abc" });

    assertNotEquals(token, undefined);

    const session = await auth.resolve(token);
    if (session.valid === false) {
      throw new Error(`Session failed to resolve with code ${session.code}`);
    }

    assertEquals(session.principal.id, "abc");
    assertEquals(session.$meta.payload.iss, "https://valkyrjs.com");
    assertEquals(session.$meta.payload.aud, "https://valkyrjs.com");
    assertEquals(session.$meta.headers.alg, "RS256");
  });

  it("should invalidate after expiry", async () => {
    const token = await auth.generate({ id: "abc" }, "1 second");

    assertNotEquals(token, undefined);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const session = await auth.resolve(token);
    if (session.valid === true) {
      throw new Error("Expected invalid session!");
    }

    assertEquals(session.code, "ERR_JWT_EXPIRED");
    assertEquals(session.message, `"exp" claim timestamp check failed`);
  });

  it("should return a raw session json object", async () => {
    const token = await auth.generate({ id: "account-a" });

    assertNotEquals(token, undefined);

    const session = await auth.resolve(token);
    if (session.valid === false) {
      throw new Error("Expected valid session!");
    }

    assertObjectMatch(session.toJSON(), {
      id: "account-a",
    });
  });

  it("should resolve access control with principal", async () => {
    const token = await auth.generate({ id: "account-a" });

    assertNotEquals(token, undefined);

    const session = await auth.resolve(token);
    if (session.valid === false) {
      throw new Error("Expected valid session!");
    }

    assertEquals(session.access.isAllowed("tenant-id"), true);
    assertEquals(session.access.isAllowed("non-tenant-id"), false);
  });
});
