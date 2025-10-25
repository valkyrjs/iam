import type z from "zod";
import type { ZodType } from "zod";

import { DatabaseInsertError } from "./errors.ts";

/**
 * Take expected record from an insert event. If no record was returned,
 * throw an error signaling no record was successfully populated.
 *
 * @param resource - Resource being populated.
 */
export function takeInserted<TSchema extends ZodType>(
  resource: string,
  schema: TSchema,
): (records: unknown[]) => z.infer<TSchema> {
  return (records: unknown[]): z.infer<TSchema> => {
    if (records[0] === undefined) {
      throw new DatabaseInsertError(resource);
    }
    return schema.parse(records[0]);
  };
}

/**
 * Takes a single record from a list of database rows.
 *
 * @param schema - Schema to map the record to.
 */
export function takeOne<TSchema extends ZodType>(
  schema: TSchema,
): (records: unknown[]) => z.infer<TSchema> | undefined {
  return (records: unknown[]) => {
    if (records[0] === undefined) {
      return undefined;
    }
    return schema.parse(records[0]);
  };
}

/**
 * Takes a list of records from a list of database rows.
 *
 * @param schema - Schema to map the records to.
 */
export function takeMany<TSchema extends ZodType>(schema: TSchema): (records: unknown[]) => z.infer<TSchema>[] {
  return (records: unknown[]) => records.map((record) => schema.parse(record));
}
