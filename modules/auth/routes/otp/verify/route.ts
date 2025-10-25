import { route } from "@platform/relay";
import z from "zod";

import { UserSchema } from "../../../schemas/user.ts";

export default route
  .post("/api/v1/otp/verify")
  .access("public")
  .query({
    next: z.string().optional(),
  })
  .body(
    z.object({
      email: z.string(),
      otp: z.string(),
    }),
  )
  .response(
    z.object({
      token: z.string(),
      user: UserSchema,
    }),
  );
