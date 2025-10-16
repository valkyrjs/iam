import { sso } from "@better-auth/sso";
import { getTenantPrincipalByUserId } from "@modules/tenant";
import { logger } from "@platform/logger";
import { UnauthorizedError } from "@platform/relay";
import { betterAuth } from "better-auth";
import { customSession, emailOTP } from "better-auth/plugins";

import database from "./auth/database.ts";

export const auth = betterAuth({
  ...database,
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache duration in seconds
    },
    additionalFields: {
      tenantId: {
        type: "string",
        required: true,
        input: false,
      },
    },
  },
  plugins: [
    sso(),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        if (type === "sign-in") {
          logger.info({ type, email, otp });
        } else if (type === "email-verification") {
          // Send the OTP for email verification
        } else {
          // Send the OTP for password reset
        }
      },
    }),
    customSession(async ({ user, session }) => {
      const principal = await getTenantPrincipalByUserId(session.userId);
      if (principal === undefined) {
        throw new UnauthorizedError("Missing 'principal' on user session.");
      }
      return {
        session,
        user,
        principal,
      };
    }),
  ],
});
