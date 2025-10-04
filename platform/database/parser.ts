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
 * @param rows - List of rows to retrieve record from.
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

export function makeModelParser<TSchema extends ZodType>(schema: TSchema): ModelParserFn<TSchema> {
  return ((value: unknown | unknown[]) => {
    if (Array.isArray(value)) {
      return value.map((value: unknown) => schema.parse(value));
    }
    if (value === undefined || value === null) {
      return undefined;
    }
    return schema.parse(value);
  }) as ModelParserFn<TSchema>;
}

type ModelParserFn<TSchema extends ZodType> = {
  (value: unknown): z.infer<TSchema> | undefined;
  (value: unknown[]): z.infer<TSchema>[];
};
