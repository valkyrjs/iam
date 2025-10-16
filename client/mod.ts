import { makeClient } from "@platform/relay";

export function iam(config: any) {
  return makeClient(config, {});
}
