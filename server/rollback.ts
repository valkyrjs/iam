import { client, makeRollback, schema } from "@platform/database";
import { resolve } from "@std/path";

const dirname = import.meta.dirname;
if (dirname === undefined) {
  throw new Error("Failed to resolve dirname from import.meta instance");
}

await makeRollback(
  {
    sql: client,
    schema,
  },
  0,
  resolve(dirname, "migrations"),
)();

Deno.exit();
