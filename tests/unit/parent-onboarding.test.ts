import { describe, expect, it } from "vitest";
import {
  createChildProfileSchema,
  parentBootstrapSchema,
  registerParentSchema
} from "@/features/parent/validation";

describe("parent onboarding validation", () => {
  it("requires strong enough parent registration input", () => {
    const result = registerParentSchema.safeParse({
      displayName: "Parent User",
      email: "parent@example.test",
      password: "short"
    });

    expect(result.success).toBe(false);
  });

  it("accepts minimal parent bootstrap data only", () => {
    const result = parentBootstrapSchema.safeParse({
      displayName: "Parent User",
      role: "ADMIN"
    });

    expect(result.success).toBe(false);
  });

  it("accepts child data without ownership fields", () => {
    const result = createChildProfileSchema.safeParse({
      nickname: "Alya",
      ageRange: "6-8",
      learningPreferences: {
        focus: "both"
      }
    });

    expect(result.success).toBe(true);
  });

  it("rejects child ownership injection", () => {
    const result = createChildProfileSchema.safeParse({
      nickname: "Alya",
      ageRange: "6-8",
      parentProfileId: "parent-2"
    });

    expect(result.success).toBe(false);
  });

  it("rejects child data with both birth year and age range", () => {
    const result = createChildProfileSchema.safeParse({
      nickname: "Alya",
      ageRange: "6-8",
      birthYear: new Date().getFullYear() - 6
    });

    expect(result.success).toBe(false);
  });

  it("rejects child data with neither birth year nor age range", () => {
    const result = createChildProfileSchema.safeParse({
      nickname: "Alya"
    });

    expect(result.success).toBe(false);
  });

  it("rejects unknown learning preference keys", () => {
    const result = createChildProfileSchema.safeParse({
      nickname: "Alya",
      ageRange: "6-8",
      learningPreferences: {
        focus: "both",
        extra: "not-allowed"
      }
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid learning preference values", () => {
    const result = createChildProfileSchema.safeParse({
      nickname: "Alya",
      ageRange: "6-8",
      learningPreferences: {
        focus: "math"
      }
    });

    expect(result.success).toBe(false);
  });

  it("rejects nicknames longer than the MVP maximum", () => {
    const result = createChildProfileSchema.safeParse({
      nickname: "a".repeat(31),
      ageRange: "6-8",
      learningPreferences: {
        focus: "both"
      }
    });

    expect(result.success).toBe(false);
  });
});
