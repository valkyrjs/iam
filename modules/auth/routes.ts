import sendOTP from "./routes/otp/send/route.ts";
import verifyOTP from "./routes/otp/send/route.ts";
import getSession from "./routes/session/get/route.ts";

export default {
  otp: {
    send: sendOTP,
    verify: verifyOTP,
  },
  session: {
    get: getSession,
  },
};
