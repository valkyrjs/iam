import z from "zod";

import { type EmailContact, EmailContactSchema } from "./email.ts";
import { type PhoneContact, PhoneContactSchema } from "./phone.ts";

/*
 |--------------------------------------------------------------------------------
 | Schema
 |--------------------------------------------------------------------------------
 */

export const ContactSchema = z.discriminatedUnion("type", [EmailContactSchema, PhoneContactSchema]);

export type Contact = z.infer<typeof ContactSchema>;

/*
 |--------------------------------------------------------------------------------
 | Value Object
 |--------------------------------------------------------------------------------
 */

export class Contacts {
  constructor(readonly contacts: Contact[]) {}

  /**
   * Check if user has a verified email.
   *
   * @example
   *
   * ```ts
   * const contacts = new Contacts([{
   *   type: "email",
   *   value: "john.doe@fixture.none",
   *   verified: true,
   *   primary: false
   * }]);
   * contacts.hasVerifiedEmail; // true
   * ```
   *
   * @returns Verified email result
   */
  get hasVerifiedEmail(): boolean {
    return this.contacts.some((contact) => contact.type === "email" && contact.verified);
  }

  /**
   * Check if user has a verified phone number.
   *
   * @example
   *
   * ```ts
   * const contacts = new Contacts([{
   *   type: "phone",
   *   fullNumber: "+155555555",
   *   verified: true,
   *   primary: false,
   *   countryCode: "+1",
   *   nationalNumber: "55555555"
   * }]);
   * contacts.hasVerifiedPhone; // true
   * ```
   *
   * @returns Verified phone result
   */
  get hasVerifiedPhone(): boolean {
    return this.contacts.some((contact) => contact.type === "phone" && contact.verified);
  }

  /**
   * Get the primary email from the list of contacts assigned to the user.
   *
   * @example
   *
   * ```ts
   * const contacts = new Contacts([{
   *   type: "email",
   *   value: "john.doe@fixture.none",
   *   primary: true,
   *   verified: false
   * }]);
   * contacts.primaryEmail; // "john.doe@fixture.none"
   * ```
   *
   * @returns Primary email address or `undefined`
   */
  get primaryEmail(): string | undefined {
    return this.contacts
      .filter((contact): contact is EmailContact => contact.type === "email")
      .find((contact) => contact.primary === true)?.value;
  }

  /**
   * Get all verified emails assigned to the user.
   *
   * @example
   *
   * ```ts
   * const contacts = new Contacts([{
   *   type: "email",
   *   value: "john.doe@fixture.none",
   *   verified: true,
   *   primary: false
   * }, {
   *   type: "email",
   *   value: "john.doe@acme.co",
   *   verified: false,
   *   primary: false
   * }]);
   * contacts.verifiedEmails; // ["john.doe@fixture.none"]
   * ```
   *
   * @returns Array of verified emails
   */
  get verifiedEmails(): string[] {
    return this.contacts
      .filter((contact): contact is EmailContact => contact.type === "email" && contact.verified === true)
      .map((contact) => contact.value);
  }

  /**
   * Get all emails (verified or not) assigned to the user.
   *
   * @example
   *
   * ```ts
   * const contacts = new Contacts([{
   *   type: "email",
   *   value: "john.doe@fixture.none",
   *   verified: true,
   *   primary: false
   * }, {
   *   type: "email",
   *   value: "john.doe@acme.co",
   *   verified: false,
   *   primary: false
   * }]);
   * contacts.emails; // ["john.doe@fixture.none", "john.doe@acme.co"]
   * ```
   *
   * @returns Array of all emails
   */
  get emails(): string[] {
    return this.contacts
      .filter((contact): contact is EmailContact => contact.type === "email")
      .map((contact) => contact.value);
  }

  /**
   * Get the primary phone number from the list of contacts assigned to the user.
   *
   * @example
   *
   * ```ts
   * const contacts = new Contacts([{
   *   type: "phone",
   *   fullNumber: "+155555555",
   *   primary: true,
   *   verified: false,
   *   countryCode: "+1",
   *   nationalNumber: "55555555"
   * }]);
   * contacts.primaryPhone; // "+155555555"
   * ```
   *
   * @returns Primary phone number or `undefined`
   */
  get primaryPhone(): string | undefined {
    return this.contacts
      .filter((contact): contact is PhoneContact => contact.type === "phone")
      .find((contact) => contact.primary === true)?.fullNumber;
  }

  /**
   * Get all verified phone numbers assigned to the user.
   *
   * @example
   *
   * ```ts
   * const contacts = new Contacts([{
   *   type: "phone",
   *   fullNumber: "+155555555",
   *   verified: true,
   *   primary: false,
   *   countryCode: "+1",
   *   nationalNumber: "55555555"
   * }, {
   *   type: "phone",
   *   fullNumber: "+155555556",
   *   verified: false,
   *   primary: false,
   *   countryCode: "+1",
   *   nationalNumber: "55555556"
   * }]);
   * contacts.verifiedPhones; // ["+155555555"]
   * ```
   *
   * @returns Array of verified phone numbers
   */
  get verifiedPhones(): string[] {
    return this.contacts
      .filter((contact): contact is PhoneContact => contact.type === "phone" && contact.verified === true)
      .map((contact) => contact.fullNumber);
  }

  /**
   * Get all phone numbers (verified or not) assigned to the user.
   *
   * @example
   *
   * ```ts
   * const contacts = new Contacts([{
   *   type: "phone",
   *   fullNumber: "+155555555",
   *   verified: true,
   *   primary: false,
   *   countryCode: "+1",
   *   nationalNumber: "55555555"
   * }, {
   *   type: "phone",
   *   fullNumber: "+155555556",
   *   verified: false,
   *   primary: false,
   *   countryCode: "+1",
   *   nationalNumber: "55555556"
   * }]);
   * contacts.phones; // ["+155555555", "+155555556"]
   * ```
   *
   * @returns Array of all phone numbers
   */
  get phones(): string[] {
    return this.contacts
      .filter((contact): contact is PhoneContact => contact.type === "phone")
      .map((contact) => contact.fullNumber);
  }

  /**
   * Find a contact by email address.
   *
   * @example
   *
   * ```ts
   * const contacts = new Contacts([{
   *   type: "email",
   *   value: "john.doe@fixture.none",
   *   verified: true,
   *   primary: false
   * }]);
   * contacts.findByEmail("john.doe@fixture.none"); // { type: "email", value: "john.doe@fixture.none", ... }
   * ```
   *
   * @param email - Email address to find
   *
   * @returns Email contact or `undefined`
   */
  findByEmail(email: string): EmailContact | undefined {
    return this.contacts.find(
      (contact): contact is EmailContact => contact.type === "email" && contact.value === email,
    );
  }

  /**
   * Find a contact by phone number.
   *
   * @example
   *
   * ```ts
   * const contacts = new Contacts([{
   *   type: "phone",
   *   fullNumber: "+155555555",
   *   verified: true,
   *   primary: false,
   *   countryCode: "+1",
   *   nationalNumber: "55555555"
   * }]);
   * contacts.findByPhone("+155555555"); // { type: "phone", fullNumber: "+155555555", ... }
   * ```
   *
   * @param phone - Phone number to find (E.164 format)
   *
   * @returns Phone contact or `undefined`
   */
  findByPhone(phone: string): PhoneContact | undefined {
    return this.contacts.find(
      (contact): contact is PhoneContact => contact.type === "phone" && contact.fullNumber === phone,
    );
  }
}
