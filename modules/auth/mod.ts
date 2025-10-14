import { context } from "@platform/relay";

import { type Session, SessionSchema } from "./data/session.ts";
import { type User, UserSchema } from "./data/user.ts";
import { auth } from "./services/auth.ts";

export * from "./data/methods.ts";

declare module "@platform/relay" {
  interface RequestContext {
    session: Session;
    user: User;
  }
}

export default {
  routes: [
    (await import("./routes/email-otp/create.ts")).default,
    (await import("./routes/email-otp/verify.ts")).default,
    (await import("./routes/session/get.ts")).default,
  ],
  bootstrap: async () => {},
  resolve: async (request: Request) => {
    const response = await auth.api.getSession(request);
    if (response === null) {
      return;
    }
    context.session = SessionSchema.parse(response.session);
    context.user = UserSchema.parse(response.user);
  },
};
