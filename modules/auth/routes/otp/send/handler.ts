import { auth } from "../../../services/auth.ts";
import route from "./route.ts";

export default route.handle(async ({ body: { email } }) => {
  return auth.api.sendVerificationOTP({ body: { email, type: "sign-in" }, asResponse: true, returnHeaders: true });
});
