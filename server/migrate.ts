import { client, makeMigration } from "@platform/database";
import { resolve } from "@std/path";

const dirname = import.meta.dirname;
if (dirname === undefined) {
  throw new Error("Failed to resolve dirname from import.meta instance");
}

await makeMigration(
  {
    sql: client,
  },
  resolve(dirname, "migrations"),
)();

Deno.exit();
