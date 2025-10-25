import type { TenantPrincipal } from "@modules/tenant";
import { UnauthorizedError } from "@platform/relay";
import { storage } from "@platform/request";
import { getMetaDirname, getRoutes } from "@platform/server";

import { type Session, SessionSchema } from "./schemas/session.ts";
import { type User, UserSchema } from "./schemas/user.ts";
import { auth } from "./services/auth.ts";

export * from "./repositories/user.ts";

/*
 |--------------------------------------------------------------------------------
 | Module
 |--------------------------------------------------------------------------------
 */

export default {
  routes: () => getRoutes(getMetaDirname(import.meta)),

  context: {
    get principal() {
      const principal = storage.getStore()?.principal;
      if (principal === undefined) {
        throw new UnauthorizedError();
      }
      return principal;
    },

    get session() {
      const session = storage.getStore()?.session;
      if (session === undefined) {
        throw new UnauthorizedError();
      }
      return session;
    },

    get user() {
      const user = storage.getStore()?.user;
      if (user === undefined) {
        throw new UnauthorizedError();
      }
      return user;
    },
  },

  storage: async (request: Request): Promise<AuthRequestStorage> => {
    const response = await auth.api.getSession(request);
    if (response === null) {
      return {};
    }
    return {
      session: SessionSchema.parse(response.session),
      user: UserSchema.parse(response.user),
      principal: response.principal,
    };
  },
};

/*
 |--------------------------------------------------------------------------------
 | Request
 |--------------------------------------------------------------------------------
 */

type AuthRequestStorage = Partial<AuthRequestContext>;

type AuthRequestContext = {
  principal: TenantPrincipal;
  session: Session;
  user: User;
};

/*
 |--------------------------------------------------------------------------------
 | Declare
 |--------------------------------------------------------------------------------
 */

declare module "@platform/request" {
  interface RequestStorage extends AuthRequestStorage {}
  interface RequestContext extends AuthRequestContext {}
}
