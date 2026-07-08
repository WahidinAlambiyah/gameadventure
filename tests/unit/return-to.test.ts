import { describe, expect, it } from "vitest";
import { safeReturnTo } from "@/server/utils/returnTo";

describe("safeReturnTo", () => {
  it("accepts safe local application paths", () => {
    expect(safeReturnTo("/parent")).toBe("/parent");
    expect(safeReturnTo("/parent/settings?tab=limits")).toBe("/parent/settings?tab=limits");
  });

  it.each([
    "https://evil.example",
    "http://evil.example",
    "//evil.example",
    "\\\\evil.example",
    "/%2F%2Fevil.example",
    "/%5C%5Cevil.example",
    "/parent\n/evil",
    "/parent\u0000",
    "javascript:alert(1)",
    "data:text/html,evil"
  ])("rejects unsafe returnTo value %s", (value) => {
    expect(safeReturnTo(value)).toBe("/parent");
  });
});
