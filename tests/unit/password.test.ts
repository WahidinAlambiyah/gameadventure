import { describe, expect, it } from "vitest";
import { hashParentPin, hashSecret, verifySecret } from "@/server/security/password";

describe("password and PIN hashing", () => {
  it("hashes and verifies a secret without returning plaintext", async () => {
    const hashed = await hashSecret("correct horse battery staple");

    expect(hashed).not.toContain("correct horse battery staple");
    await expect(verifySecret(hashed, "correct horse battery staple")).resolves.toBe(true);
    await expect(verifySecret(hashed, "wrong")).resolves.toBe(false);
  });

  it("requires a four-digit parent PIN", async () => {
    await expect(hashParentPin("1234")).resolves.toEqual(expect.any(String));
    await expect(hashParentPin("12345")).rejects.toThrow(/four digits/);
  });
});
