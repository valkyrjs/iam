import { TenantSchema } from "@modules/tenant";
import { route } from "@platform/relay";
import { z } from "zod/v4";

export default route
  .get("/api/v1/tenant/:tenantId")
  .params({ tenantId: z.string().describe("Unique identifier of the tenant") })
  .response(TenantSchema);
