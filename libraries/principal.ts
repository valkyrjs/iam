import {
  z,
  type ZodArray,
  type ZodObject,
  type ZodRawShape,
  type ZodString,
  type ZodUnion,
} from "zod";

export type AnyPrincipalProvider = PrincipalProvider<any, any>;

/**
 * A `PrincipalProvider` encapsulates the definition and resolution of principals.
 *
 * Responsibilities:
 *   - Defines the allowed set of roles (`role` schema).
 *   - Defines the shape of attributes (`attributes` schema).
 *   - Provides a resolver function to fetch principals by ID.
 *
 * This pattern ensures that principal construction is always type-safe and
 * environment-specific (DB, API, directory, etc.), without requiring subclassing.
 *
 * @template TRole       - A Zod union of string literals representing valid roles.
 * @template TAttributes - A Zod shape describing the schema of principal attributes.
 *
 * @example
 * import { z } from "zod";
 *
 * const roleSchema = z.union([z.literal("admin"), z.literal("user")]);
 * const attrSchema = {
 *   department: z.string(),
 *   region: z.string(),
 * };
 *
 * const provider = new PrincipalProvider(
 *   roleSchema,
 *   attrSchema,
 *   async (id) => {
 *     const roles = await getRolesFromDb(id);
 *     const attributes = await getAttributesFromDb(id);
 *     return { id, roles, attributes };
 *   },
 * );
 *
 * const principal = await provider.resolve("123e4567-e89b-12d3-a456-426614174000");
 */
export class PrincipalProvider<
  TRoles extends ZodUnion,
  TAttributes extends ZodRawShape,
> {
  /**
   * Zod schema describing all valid roles for a principal.
   *
   * Example:
   * ```ts
   * z.union([z.literal("admin"), z.literal("user")])
   * ```
   */
  readonly roles: TRoles;

  /**
   * Zod object schema describing all attributes for a principal.
   *
   * Example:
   * ```ts
   * z.object({ department: z.string(), region: z.string() })
   * ```
   */
  readonly attributes: ZodObject<TAttributes>;

  /**
   * Internal resolver function, defined at construction.
   *
   * @internal
   */
  readonly #resolver: (
    this: PrincipalProvider<TRoles, TAttributes>,
    id: string,
  ) => PrincipalResult<TRoles, TAttributes>;

  /**
   * Canonical Zod schema for a principal object, combining:
   *   - `id`: string identifier
   *   - `roles`: validated against {@link role}
   *   - `attributes`: validated against {@link attributes}
   *
   * This schema is used internally in {@link resolve}, but can also be
   * consumed directly for validation in tests or other contexts.
   *
   * Example:
   * ```ts
   * provider.schema.parse({
   *   id: "123",
   *   roles: ["admin"],
   *   attributes: { department: "sales", region: "eu" },
   * });
   * ```
   */
  readonly schema: ZodObject<{
    id: ZodString;
    roles: ZodArray<TRoles>;
    attributes: ZodObject<TAttributes>;
  }>;

  declare $principal: Principal<TRoles, TAttributes>;

  /**
   * Convenience type alias for inferred attributes, available in
   * consumers without manual extraction.
   *
   * Example:
   * ```ts
   * type Attributes = provider["$attributes"];
   * ```
   */
  declare $attributes: z.infer<ZodObject<TAttributes>>;

  /**
   * Create a new `PrincipalProvider` instance.
   *
   * @param roles      - Zod union defining the set of valid roles.
   * @param attributes - Zod shape defining the attributes schema.
   * @param resolver   - Function that resolves a principal by ID.
   */
  constructor(
    roles: TRoles,
    attributes: TAttributes,
    resolver: (
      this: PrincipalProvider<TRoles, TAttributes>,
      id: string,
    ) => PrincipalResult<TRoles, TAttributes>,
  ) {
    this.roles = roles;
    this.attributes = z.object(attributes);
    this.schema = z.object({
      id: z.string(),
      roles: z.array(roles),
      attributes: z.object(attributes),
    });
    this.#resolver = resolver.bind(this);
  }

  /**
   * Resolve a fully populated principal by its unique identifier.
   *
   * Delegates to the resolver function provided at construction, ensuring
   * results are validated against the internal schema.
   *
   * @param id - The unique identifier of the principal.
   *
   * @returns A `Principal` or `Promise<Principal>` including ID, roles,
   *          and attributes.
   *
   * @throws If the resolver function rejects or returns invalid data.
   */
  resolve(id: string): PrincipalResult<TRoles, TAttributes> {
    return this.#resolver(id);
  }
}

/**
 * A helper type describing the contract for principal resolvers.
 *
 * A principal resolver is responsible for looking up a principal by its ID
 * and returning a full `Principal` object (synchronously or asynchronously).
 *
 * This type is primarily used internally by {@link PrincipalProvider} to
 * define the shape of the resolver function. In most cases, consumers should
 * prefer constructing a `PrincipalProvider` instead of using this type directly.
 *
 * @typeParam TRole - The Zod union schema defining valid role values.
 * @typeParam TAttributes - A record type describing additional principal attributes.
 */
type PrincipalResult<
  TRoles extends ZodUnion,
  TAttributes extends ZodRawShape,
> =
  | Promise<Principal<TRoles, TAttributes> | undefined>
  | Principal<TRoles, TAttributes>
  | undefined;

/*
 |--------------------------------------------------------------------------------
 | Principal
 |--------------------------------------------------------------------------------
 |
 | A `Principal` represents an authenticated actor in the system, typically a user
 | or service, whose identity and associated metadata are used during
 | authorization and access control decisions.
 |
 | The principal encapsulates both:
 |   1. **Roles** – high-level groupings of permissions or responsibilities.
 |   2. **Attributes** – fine-grained information used for context-aware access
 |      control (ABAC) and policy evaluation.
 |
 | The `Principal` type is generic to allow strong typing for roles and attributes
 | specific to your application.
 |
 */

export type AnyPrincipal = Principal<ZodUnion, ZodRawShape>;

/**
 * Represents an authenticated entity in the system and its associated access
 * control metadata.
 *
 * @template TRole       - A union of string literals representing roles which
 *                         can be assigned to the principal.
 * @template TAttributes - A record of key/value pairs representing fine-grained
 *                         attributes for policy evaluation.
 *
 * @example
 * type Role = z.ZodUnion<[z.ZodLiteral<"admin">, z.ZodLiteral<"user">]>;
 * type Attributes = { department: z.ZodString; region: z.ZodString };
 *
 * const principal: Principal<Role, Attributes> = {
 *   id: "123e4567-e89b-12d3-a456-426614174000",
 *   roles: ["admin"],
 *   attributes: { department: "Engineering", region: "EMEA" },
 * };
 */
export type Principal<
  TRoles extends ZodUnion,
  TAttributes extends ZodRawShape,
> = {
  /**
   * The unique identifier of the principal.
   * Examples: Windows user SID, Active Directory DN, AWS user ARN, or
   * database user UUID.
   */
  id: string;

  /**
   * List of roles assigned to the principal.
   *
   * Roles are typically used during role-based access control (RBAC)
   * evaluation.
   */
  roles: z.infer<TRoles>[];

  /**
   * Key/value attributes associated with the principal.
   *
   * Attributes can represent department, region, subscription tier,
   * ownership, or any contextual data used for attribute-based access control
   * (ABAC) policies.
   */
  attributes: z.infer<ZodObject<TAttributes>>;
};

/**
 * A function type that resolves a principal by its unique identifier.
 *
 * This resolver is responsible for retrieving all relevant metadata for a principal,
 * including both roles and attributes, based on their ID.
 *
 * @template TRole       - A union of string literals representing roles assignable to the principal.
 * @template TAttributes - A record of key/value pairs representing fine-grained attributes for policy evaluation.
 *
 * @param id - The unique identifier of the principal to resolve.
 *
 * @returns A promise that resolves to a fully populated `Principal` object
 *          containing:
 *            - `id`: The principal's unique identifier.
 *            - `roles`: All roles assigned to the principal.
 *            - `attributes`: Fine-grained attributes used for access control.
 *
 * @throws Errors may be thrown if the principal cannot be found or
 *         if roles or attributes cannot be retrieved.
 *
 * @example
 * const getPrincipal: PrincipalResolver<MyRoles, MyAttributes> = async (id) => {
 *   const roles = await getRolesForUser(id);
 *   const attributes = await getAttributesForUser(id);
 *   return { id, roles, attributes };
 * };
 *
 * const principal = await getPrincipal("123e4567-e89b-12d3-a456-426614174000");
 */
export type PrincipalResolver<
  TRole extends ZodUnion,
  TAttributes extends ZodRawShape,
> = (
  id: string,
) =>
  | Promise<Principal<TRole, TAttributes> | undefined>
  | Principal<TRole, TAttributes>
  | undefined;
