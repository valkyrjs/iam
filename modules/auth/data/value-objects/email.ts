import z from "zod";

export const EmailContactSchema = z.object({
  type: z.literal("email"),
  label: z.string().optional().describe("Optional display label for the email address."),
  context: z.enum(["personal", "work"]).optional().describe("The context of the email address."),
  value: z.email().describe("A valid email address string."),
  primary: z.boolean().default(false).describe("Indicates if this is the primary email."),
  verified: z.boolean().default(false).describe("True if the email address has been verified."),
});

export type EmailContact = z.infer<typeof EmailContactSchema>;
