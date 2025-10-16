import z from "zod";

export const PhoneContactSchema = z.object({
  type: z.literal("phone"),
  context: z
    .enum(["mobile", "landline", "fax", "voip", "other"])
    .optional()
    .describe("Type of phone line: mobile, landline, fax, VoIP, or other"),
  countryCode: z
    .string()
    .startsWith("+")
    .min(2)
    .max(4)
    .describe("The international dialing prefix, e.g., +1 for USA, +44 for UK"),
  nationalNumber: z.string().min(4).max(15).describe("The local phone number without the country code"),
  fullNumber: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, "Invalid E.164 phone number")
    .describe("The full phone number in E.164 format (e.g., +1234567890)"),
  extension: z.string().optional().describe("Optional phone extension, often used in corporate settings"),
  primary: z.boolean().default(false).describe("Indicates if this is the primary phone number."),
  verified: z.boolean().default(false).describe("True if the phone number has been verified."),
  label: z.string().optional().describe("Optional display label for the phone number."),
});

export type PhoneContact = z.infer<typeof PhoneContactSchema>;
