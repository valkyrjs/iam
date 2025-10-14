import { getEnvironmentVariable } from "@platform/config";
import z from "zod";

export const config = {
  vault: {
    secret: getEnvironmentVariable({
      key: "IAM_VAULT_SECRET",
      type: z.string(),
      envFallback: {
        local: "iam-vault-secret",
        testing: "iam-vault-secret",
      },
    }),
  },
};
