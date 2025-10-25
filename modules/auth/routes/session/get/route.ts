import { TenantPrincipalSchema } from "@modules/tenant";
import { route } from "@platform/relay";
import { z } from "zod/v4";

import { SessionSchema } from "../../../schemas/session.ts";
import { UserSchema } from "../../../schemas/user.ts";

export default route.get("/api/v1/session").response(
  z.object({
    session: SessionSchema,
    user: UserSchema,
    principal: TenantPrincipalSchema,
  }),
);
