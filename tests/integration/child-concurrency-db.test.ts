import { PrismaPg } from "@prisma/adapter-pg";
import { describe, expect, it } from "vitest";
import { PrismaClient } from "@/generated/prisma/client";
import { createChildForParent } from "@/server/repositories/childRepository";
import { ConflictError } from "@/server/errors/errors";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  describe("database-backed child concurrency", () => {
    it("skips because TEST_DATABASE_URL is not configured", () => {
      console.warn(
        "Skipping database-backed child concurrency test: TEST_DATABASE_URL is not configured."
      );
      expect(testDatabaseUrl).toBeUndefined();
    });
  });
} else {
  describe("database-backed child concurrency", () => {
    it("creates exactly one active child under real concurrent writes", async () => {
      const db = new PrismaClient({
        adapter: new PrismaPg({ connectionString: testDatabaseUrl })
      });
      const email = `child-concurrency-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
      let userId: string | undefined;
      let parentProfileId: string | undefined;

      try {
        const user = await db.user.create({
          data: {
            email,
            name: "Concurrency Parent",
            emailVerified: true
          },
          select: { id: true }
        });
        userId = user.id;

        const parentProfile = await db.parentProfile.create({
          data: {
            userId,
            displayName: "Concurrency Parent"
          },
          select: { id: true }
        });
        parentProfileId = parentProfile.id;

        const childInput = {
          nickname: "Alya",
          ageRange: "6-8" as const,
          avatarKey: "starter-star" as const,
          learningPreferences: { focus: "both" as const }
        };

        const results = await Promise.all(
          [
            createChildForParent(parentProfileId, childInput, db),
            createChildForParent(parentProfileId, { ...childInput, nickname: "Bima" }, db)
          ].map(async (operation) => {
            try {
              await operation;
              return 201;
            } catch (error) {
              if (error instanceof ConflictError) return 409;
              throw error;
            }
          })
        );

        expect(results.sort()).toEqual([201, 409]);

        const activeChildren = await db.childProfile.count({
          where: {
            parentProfileId,
            deletedAt: null
          }
        });

        expect(activeChildren).toBe(1);
      } finally {
        if (parentProfileId) {
          await db.childProfile.deleteMany({ where: { parentProfileId } });
          await db.parentProfile.deleteMany({ where: { id: parentProfileId } });
        }
        if (userId) {
          await db.user.deleteMany({ where: { id: userId, email } });
        }
        await db.$disconnect();
      }
    }, 30000);
  });
}
