import auth from "@modules/auth/routes";
import { makeClient } from "@platform/relay";

export function iam(config: any) {
  return makeClient(config, {
    ...auth,
  });
}
