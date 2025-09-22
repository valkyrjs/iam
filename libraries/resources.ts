import { z, type ZodObject, type ZodRawShape } from "zod";

import { ResourceNotFoundError } from "./errors.ts";
import { Prettify } from "./types.ts";

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
 *   { kind: "employee", attr: { public: z.boolean() } },
 *   { kind: "document", attr: { ownerId: z.string() } }
 * ]);
 *
 * // Check if a kind is registered
 * registry.has("employee"); // true
 *
 * // Retrieve the schema for validation
 * const { attr } = registry.get("document");
 * attr.parse({ ownerId: "abc" }); // ✅
 *
 * // Parse a full resource instance
 * const doc = registry.parse("document", "doc-123", { ownerId: "abc" });
 * // => { kind: "document", id: "doc-123", attr: { ownerId: "abc" } }
 */
export class ResourceRegistry<TResources extends AnyResourceSchema[]> {
  readonly #index = new Map<
    TResources[number]["kind"],
    {
      attr: ZodObject<TResources[number]["attr"]>;
      actions: TResources[number]["actions"];
    }
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
    ? TResource extends ResourceSchema<infer TKind, infer TAttributes, any>
      ? Prettify<Resource<TKind, TAttributes>>
      : never
    : never;

  declare $action: TResources[number] extends infer TResource
    ? TResource extends ResourceSchema<infer TKind, any, infer TActions>
      ? {
          kind: TKind;
          actions: TActions[number][];
        }
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
      this.#index.set(resource.kind, {
        attr: z.object(resource.attr),
        actions: resource.actions,
      });
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
   *   - `attr`: The Zod object schema for its attr.
   *
   * @throws {ResourceNotFoundError}
   *         If the resource kind has not been registered.
   */
  get<TKind extends TResources[number]["kind"]>(
    kind: TKind,
  ): {
    kind: TKind;
    attr: ResourceAttributesParser<TResources, TKind>;
    actions: ResourceActions<TResources, TKind>;
  } {
    const resource = this.#index.get(kind);
    if (resource === undefined) {
      throw new ResourceNotFoundError(kind);
    }
    return { kind, ...resource };
  }

  /**
   * Parse and validate the attr of a resource instance.
   *
   * Combines a resource’s `kind` and `id` with its validated attr.
   *
   * @param kind - The resource kind.
   * @param id   - The unique identifier of the resource.
   * @param attr - Raw attr to validate and parse.
   *
   * @returns A fully validated {@link Resource}.
   *
   * @throws {ResourceNotFoundError}
   *         If the resource kind has not been registered.
   * @throws {ZodError}
   *         If the attr fail validation against the schema.
   */
  parse<TKind extends TResources[number]["kind"]>(
    kind: TKind,
    id: string,
    attr: ResourceAttributes<TResources, TKind>,
  ): {
    kind: TKind;
    id: string;
    attr: ResourceAttributes<TResources, TKind>;
  } {
    const resource = this.get(kind);
    return {
      kind,
      id,
      attr: resource.attr.parse(attr),
    } as {
      kind: TKind;
      id: string;
      attr: z.infer<
        ZodObject<Extract<TResources[number], { kind: TKind }>["attr"]>
      >;
    };
  }
}

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

type AnyResourceSchema = ResourceSchema<string, ZodRawShape, Array<any>>;

type ResourceSchema<
  TKind extends string,
  TAttributes extends ZodRawShape,
  TActions extends Array<any>,
> = {
  kind: TKind;
  attr: TAttributes;
  actions: TActions;
};

export type AnyAction = {
  kind: any;
  actions: any[];
};

/**
 * Represents any resource type.
 *
 * Useful when working with heterogeneous resource collections
 * where the specific `kind` or attribute schema is unknown.
 */
export type AnyResource = Resource<string, ZodRawShape>;

/**
 * Defines a typed resource with a specific `kind` and attr.
 *
 * @template TKind      - The resource kind.
 * @template TAttributes - The Zod attribute schema.
 */
export type Resource<TKind extends string, TAttributes extends ZodRawShape> = {
  kind: TKind;
  id: string;
  attr: z.infer<ZodObject<TAttributes>>;
};

type ResourceAttributes<
  TResources extends AnyResourceSchema[],
  TKind extends TResources[number]["kind"],
> = z.infer<ResourceAttributesParser<TResources, TKind>>;

type ResourceAttributesParser<
  TResources extends AnyResourceSchema[],
  TKind extends TResources[number]["kind"],
> = ZodObject<Extract<TResources[number], { kind: TKind }>["attr"]>;

type ResourceActions<
  TResources extends AnyResourceSchema[],
  TKind extends TResources[number]["kind"],
> = Extract<TResources[number], { kind: TKind }>["actions"];
