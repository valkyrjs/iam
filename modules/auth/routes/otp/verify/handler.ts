import { auth } from "../../../services/auth.ts";
import route from "./route.ts";

export default route.handle(async ({ body: { email, otp } }) => {
  return auth.api.signInEmailOTP({ body: { email, otp }, asResponse: true, returnHeaders: true });
});
