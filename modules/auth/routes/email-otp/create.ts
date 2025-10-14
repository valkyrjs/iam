import { route } from "@platform/relay";
import z from "zod";

import { auth } from "../../services/auth.ts";

export default route
  .post("/api/v1/auth/email-otp")
  .body(
    z.object({
      email: z.string(),
    }),
  )
  .response(
    z.object({
      success: z.boolean(),
    }),
  )
  .handle(async ({ body: { email } }) => {
    return auth.api.sendVerificationOTP({ body: { email, type: "sign-in" } });
  });
