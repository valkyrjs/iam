import z, { type ZodType } from "zod";

export function ZodJSONB<TSchema extends ZodType>(schema: TSchema) {
  return {
    input: schema.transform((value) => JSON.stringify(value)),
    output: z
      .string()
      .transform((value) => {
        if (typeof value === "string") {
          return JSON.parse(value);
        }
        return value;
      })
      .pipe(schema),
  };
}
