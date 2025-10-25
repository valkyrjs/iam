import z, { type ZodType } from "zod";

export function ZodValueObject<TValueObject extends new (...args: any[]) => any, TSchema extends ZodType>(
  ValueObject: TValueObject,
  schema: TSchema,
) {
  return {
    read: z.union([z.string(), z.null()]).transform((value) => {
      if (value === null) {
        return null;
      }
      if (typeof value === "string") {
        return new ValueObject(schema.parse(JSON.parse(value))) as InstanceType<TValueObject>;
      }
      return new ValueObject(schema.parse(value)) as InstanceType<TValueObject>;
    }),
    write: schema.transform((value) => JSON.stringify(value)),
  };
}

export function ZodJSONB<TSchema extends ZodType>(schema: TSchema) {
  return {
    read: z
      .union([z.string(), z.null()])
      .transform((value) => {
        if (typeof value === "string") {
          return JSON.parse(value);
        }
        return value;
      })
      .pipe(schema),
    write: schema.transform((value) => JSON.stringify(value)),
  };
}
