import { getTenantById } from "@modules/tenant";
import { NotFoundError } from "@platform/relay";

import route from "./route.ts";

export default route.handle(async ({ params: { tenantId } }) => {
  const tenant = await getTenantById(tenantId);
  if (tenant === undefined) {
    return new NotFoundError("Tenant not found");
  }
  return tenant;
});
