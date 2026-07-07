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
        starterTrack: "sastra-nusantara"
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
});
