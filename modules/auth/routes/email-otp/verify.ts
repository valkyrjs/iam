import { logger } from "@platform/logger";
import { NotFoundError, route } from "@platform/relay";
import z from "zod";

import { auth } from "../../services/auth.ts";

export default route
  .post("/api/v1/auth/email-otp/verify")
  .query({
    next: z.string().optional(),
  })
  .body(
    z.object({
      email: z.string(),
      otp: z.string(),
    }),
  )
  .handle(async ({ body: { email, otp } }) => {
    const response = await auth.api.signInEmailOTP({ body: { email, otp }, asResponse: true, returnHeaders: true });
    if (response.status !== 200) {
      logger.error("OTP Signin Failed", await response.json());
      return new NotFoundError();
    }
    return new Response(null, {
      headers: response.headers,
    });
  });
