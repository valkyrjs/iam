import { z, type ZodObject, type ZodRawShape } from "zod";

import { ResourceNotFoundError } from "./errors.ts";

export type AnyResourceRegistry = ResourceRegistry<AnyResourceSchema[]>;

/**
 * A `ResourceRegistry` manages the set of resource types available
 * for access control. Each resource is defined by:
 *
 *   - A unique `kind` string literal
 *   - A Zod attribute schema describing its shape
 *
 * The registry provides type-safe lookups, schema validation, and
 * runtime guarantees that resources conform to their registered schemas.
 *
 * @template TResources - A tuple of {@link ResourceSchema} definitions.
 *
 * @example
 * const registry = new ResourceRegistry([
 *   { kind: "employee", attributes: { public: z.boolean() } },
 *   { kind: "document", attributes: { ownerId: z.string() } }
 * ]);
 *
 * // Check if a kind is registered
 * registry.has("employee"); // true
 *
 * // Retrieve the schema for validation
 * const { attributes } = registry.get("document");
 * attributes.parse({ ownerId: "abc" }); // ✅
 *
 * // Parse a full resource instance
 * const doc = registry.parse("document", "doc-123", { ownerId: "abc" });
 * // => { kind: "document", id: "doc-123", attributes: { ownerId: "abc" } }
 */
export class ResourceRegistry<TResources extends AnyResourceSchema[]> {
  readonly #index = new Map<
    TResources[number]["kind"],
    ZodObject<TResources[number]["attributes"]>
  >();

  /**
   * Convenience type alias representing a resource instance
   * based on this registry’s resource definitions.
   *
   * Example:
   * ```ts
   * type Resource = typeof registry.$resource;
   * ```
   */
  declare $resource: TResources[number] extends infer TResource
    ? TResource extends ResourceSchema<infer TKind, infer TAttributes>
      ? Resource<TKind, TAttributes>
      : never
    : never;

  /**
   * Create a new `ResourceRegistry` instance.
   *
   * Each resource kind is mapped to its Zod attribute schema,
   * which is used for parsing and validation.
   *
   * @param resources - A tuple of resources to register.
   */
  constructor(readonly resources: TResources) {
    for (const resource of resources) {
      this.#index.set(resource.kind, z.object(resource.attributes));
    }
  }

  /**
   * Check whether a resource kind has been registered.
   *
   * @param kind - The resource kind to check.
   * @returns `true` if the kind exists, `false` otherwise.
   */
  has<TKind extends TResources[number]["kind"]>(kind: TKind): boolean {
    return this.#index.has(kind);
  }

  /**
   * Retrieve a resource’s attribute schema.
   *
   * @param kind - The resource kind to retrieve.
   * @returns An object containing:
   *   - `kind`: The resource kind.
   *   - `attributes`: The Zod object schema for its attributes.
   *
   * @throws {ResourceNotFoundError}
   *         If the resource kind has not been registered.
   */
  get<TKind extends TResources[number]["kind"]>(
    kind: TKind,
  ): {
    kind: TKind;
    attributes: ResourceAttributesParser<TResources, TKind>;
  } {
    const attributes = this.#index.get(kind);
    if (attributes === undefined) {
      throw new ResourceNotFoundError(kind);
    }
    return { kind, attributes };
  }

  /**
   * Parse and validate the attributes of a resource instance.
   *
   * Combines a resource’s `kind` and `id` with its validated attributes.
   *
   * @param kind       - The resource kind.
   * @param id         - The unique identifier of the resource.
   * @param attributes - Raw attributes to validate and parse.
   *
   * @returns A fully validated {@link Resource}.
   *
   * @throws {ResourceNotFoundError}
   *         If the resource kind has not been registered.
   * @throws {ZodError}
   *         If the attributes fail validation against the schema.
   */
  parse<TKind extends TResources[number]["kind"]>(
    kind: TKind,
    id: string,
    attributes: ResourceAttributes<TResources, TKind>,
  ): {
    kind: TKind;
    id: string;
    attributes: ResourceAttributes<TResources, TKind>;
  } {
    const resource = this.get(kind);
    return {
      kind,
      id,
      attributes: resource.attributes.parse(attributes),
    } as {
      kind: TKind;
      id: string;
      attributes: z.infer<
        ZodObject<Extract<TResources[number], { kind: TKind }>["attributes"]>
      >;
    };
  }
}

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

type AnyResourceSchema = ResourceSchema<string, ZodRawShape>;

type ResourceSchema<TKind extends string, TAttributes extends ZodRawShape> = {
  kind: TKind;
  attributes: TAttributes;
};

/**
 * Represents any resource type.
 *
 * Useful when working with heterogeneous resource collections
 * where the specific `kind` or attribute schema is unknown.
 */
export type AnyResource = Resource<string, ZodRawShape>;

/**
 * Defines a typed resource with a specific `kind` and attributes.
 *
 * @template TKind      - The resource kind.
 * @template TAttributes - The Zod attribute schema.
 */
export type Resource<TKind extends string, TAttributes extends ZodRawShape> = {
  kind: TKind;
  id: string;
  attributes: z.infer<ZodObject<TAttributes>>;
};

type ResourceAttributes<
  TResources extends AnyResourceSchema[],
  TKind extends TResources[number]["kind"],
> = z.infer<ResourceAttributesParser<TResources, TKind>>;

type ResourceAttributesParser<
  TResources extends AnyResourceSchema[],
  TKind extends TResources[number]["kind"],
> = ZodObject<Extract<TResources[number], { kind: TKind }>["attributes"]>;
