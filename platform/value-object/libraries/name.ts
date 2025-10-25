import { ZodValueObject } from "@platform/utilities";
import z from "zod";

/*
 |--------------------------------------------------------------------------------
 | Value Object
 |--------------------------------------------------------------------------------
 */

export class UserName {
  constructor(readonly name: Name) {}

  /**
   * Get the full name in "Given Family" format.
   *
   * @example
   *
   * ```ts
   * const name = new UserName({
   *   given: "John",
   *   family: "Doe"
   * });
   * name.full; // "John Doe"
   * ```
   *
   * @returns Full name string
   */
  get full(): string {
    return [this.name.given, this.name.middle, this.name.family].filter((value) => value !== undefined).join(" ");
  }

  /**
   * Get the display name, preferring the preferred name if available.
   *
   * @example
   *
   * ```ts
   * const name = new UserName({
   *   given: "John",
   *   family: "Doe",
   *   preferred: "Johnny"
   * });
   * name.display; // "Johnny"
   * ```
   *
   * @returns Display name string
   */
  get display(): string {
    return this.name.preferred ?? this.name.given;
  }

  /**
   * Get the formal name in "Family, Given" format.
   *
   * @example
   *
   * ```ts
   * const name = new UserName({
   *   given: "John",
   *   family: "Doe"
   * });
   * name.formal; // "Doe, John"
   * ```
   *
   * @returns Formal name string
   */
  get formal(): string {
    return `${this.name.family}, ${this.name.given}`;
  }

  /**
   * Get initials from the name.
   *
   * @example
   *
   * ```ts
   * const name = new UserName({
   *   given: "John",
   *   family: "Doe",
   *   middle: "James"
   * });
   * name.initials; // "JJD"
   * ```
   *
   * @returns Initials string
   */
  get initials(): string {
    return [this.name.given, this.name.middle, this.name.family]
      .filter((value) => value !== undefined)
      .map((part) => part[0].toUpperCase())
      .join("");
  }

  toString() {
    return this.full;
  }

  /**
   * Return name object.
   */
  toJSON() {
    return this.name;
  }
}

/*
 |--------------------------------------------------------------------------------
 | Schema
 |--------------------------------------------------------------------------------
 */

export const NameSchema = ZodValueObject(
  UserName,
  z.object({
    given: z.string().min(1).describe("Given name, also known as first name."),
    family: z.string().min(1).describe("Family name, also known as last name or surname."),
    middle: z.string().optional().describe("Middle name or initial."),
    preferred: z.string().optional().describe("Preferred name or nickname for display purposes."),
  }),
);

export type Name = z.input<(typeof NameSchema)["write"]>;
