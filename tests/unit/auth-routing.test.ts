import { describe, expect, it } from "vitest";
import { resolvePostLoginPath } from "@/features/authentication/routing";

describe("post-login routing", () => {
  it("routes onboarded parents with a child to the parent dashboard", () => {
    expect(
      resolvePostLoginPath({
        roles: ["PARENT"],
        permissions: ["child:read-own"],
        onboardingComplete: true,
        activeChildCount: 1
      })
    ).toBe("/parent");
  });

  it("routes parent accounts without a child to child setup", () => {
    expect(
      resolvePostLoginPath({
        roles: ["PARENT"],
        permissions: ["child:read-own"],
        onboardingComplete: true,
        activeChildCount: 0
      })
    ).toBe("/parent/children/new");
  });

  it("routes admin users to the protected admin area", () => {
    expect(
      resolvePostLoginPath({
        roles: ["ADMIN"],
        permissions: ["admin:access"],
        onboardingComplete: false,
        activeChildCount: 0
      })
    ).toBe("/admin");
  });

  it("does not route unrelated roles into parent onboarding", () => {
    expect(
      resolvePostLoginPath({
        roles: ["CONTENT_EDITOR"],
        permissions: ["content:create"],
        onboardingComplete: false,
        activeChildCount: 0
      })
    ).toBe("/");
  });
});
