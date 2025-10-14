import { sso } from "@better-auth/sso";
import { connectionString, schemaString } from "@platform/database";
import { logger } from "@platform/logger";
import { betterAuth } from "better-auth";
import { emailOTP, organization } from "better-auth/plugins";
import { Pool } from "pg";

export const auth = betterAuth({
  database: new Pool({
    connectionString,
  }),
  account: {
    modelName: `${schemaString}.account`,
  },
  verification: {
    modelName: `${schemaString}.verification`,
  },
  user: {
    modelName: `${schemaString}.user`,
  },
  session: {
    modelName: `${schemaString}.session`,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache duration in seconds
    },
  },
  plugins: [
    organization(),
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
  ],
});
