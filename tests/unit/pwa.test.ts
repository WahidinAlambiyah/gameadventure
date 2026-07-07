import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";

describe("PWA manifest", () => {
  it("contains installability basics", () => {
    const data = manifest();

    expect(data.name).toBe("BacaNgaji Adventure");
    expect(data.display).toBe("standalone");
    expect(data.icons?.length).toBeGreaterThan(0);
    expect(data.theme_color).toBe("#2f7d75");
  });
});
