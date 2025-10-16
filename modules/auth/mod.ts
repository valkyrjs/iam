import type { TenantPrincipal } from "@modules/tenant";
import { context } from "@platform/relay";
import { getMetaDirname, getRoutes } from "@platform/server";

import { type Session, SessionSchema } from "./data/session.ts";
import { type User, UserSchema } from "./data/user.ts";
import { auth } from "./services/auth.ts";

export * from "./data/methods.ts";

declare module "@platform/relay" {
  interface RequestContext {
    session: Session;
    user: User;
    principal: TenantPrincipal;
  }
}

export default {
  routes: () => getRoutes(getMetaDirname(import.meta)),
  bootstrap: async () => {},
  resolve: async (request: Request) => {
    const response = await auth.api.getSession(request);
    if (response === null) {
      return;
    }
    context.session = SessionSchema.parse(response.session);
    context.user = UserSchema.parse(response.user);
    context.principal = response.principal;
  },
};
