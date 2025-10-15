import { route } from "@platform/relay";
import z from "zod";

export default route
  .post("/api/v1/otp/send")
  .access("public")
  .body(
    z.object({
      email: z.string(),
    }),
  );
