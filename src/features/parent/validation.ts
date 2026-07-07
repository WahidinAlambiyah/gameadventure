import { z } from "zod";

const currentYear = new Date().getFullYear();

export const parentBootstrapSchema = z
  .object({
    displayName: z.string().trim().min(2).max(80)
  })
  .strict();

export const registerParentSchema = parentBootstrapSchema.extend({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(12).max(128)
});

export const loginParentSchema = z
  .object({
    email: z.email().trim().toLowerCase(),
    password: z.string().min(1).max(128)
  })
  .strict();

export const createChildProfileSchema = z
  .object({
    nickname: z.string().trim().min(2).max(30),
    birthYear: z
      .number()
      .int()
      .min(currentYear - 12)
      .max(currentYear)
      .optional(),
    ageRange: z.enum(["3-5", "6-8", "9-12"]).optional(),
    avatarKey: z.enum(["starter-star", "forest-reader", "moon-scout"]).optional(),
    learningPreferences: z
      .object({
        focus: z.enum(["reading", "hijaiyah", "both"])
      })
      .strict()
      .default({ focus: "both" })
  })
  .strict()
  .refine((value) => (value.birthYear === undefined) !== (value.ageRange === undefined), {
    message: "Provide exactly one of birth year or age range.",
    path: ["ageRange"]
  });

export type ParentBootstrapInput = z.infer<typeof parentBootstrapSchema>;
export type RegisterParentInput = z.infer<typeof registerParentSchema>;
export type LoginParentInput = z.infer<typeof loginParentSchema>;
export type CreateChildProfileInput = z.infer<typeof createChildProfileSchema>;
