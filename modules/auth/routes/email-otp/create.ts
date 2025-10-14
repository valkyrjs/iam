import { route } from "@platform/relay";
import z from "zod";

import { auth } from "../../services/auth.ts";

export default route
  .post("/api/v1/email-otp")
  .access("public")
  .body(
    z.object({
      email: z.string(),
    }),
  )
  .handle(async ({ body: { email } }) => {
    return auth.api.sendVerificationOTP({ body: { email, type: "sign-in" }, asResponse: true, returnHeaders: true });
  });
