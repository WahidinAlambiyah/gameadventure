import { beforeEach, describe, expect, it } from "vitest";
import { GET as childProgress } from "@/app/api/v1/children/[childId]/progress/route";
import { POST as recordAttempt } from "@/app/api/v1/children/[childId]/game-sessions/[sessionId]/attempts/route";
import { POST as startSession } from "@/app/api/v1/children/[childId]/game-sessions/route";
import { PUT as writePin } from "@/app/api/v1/parent/security/pin/route";
import { resetTestChildren, seedTestChild } from "@/server/repositories/childRepository";
import { adventurePlayTest } from "@/server/services/adventurePlay";
import { resetTestParentPins } from "@/server/parent-gate/pinService";

const childId = "child-1";
const parentId = "parent-1";
const otherParentId = "parent-2";
const firstLevelId = "33333333-3333-4333-8333-333333333331";
const secondLevelId = "33333333-3333-4333-8333-333333333332";
const firstQuestionId = "55555555-5555-4555-8555-555555555551";
const correctOptionId = "66666666-6666-4666-8666-666666666661";

const parentHeaders = {
  "x-test-user-id": "user-1",
  "x-test-user-email": "parent@example.test",
  "x-test-roles": "PARENT",
  "x-test-permissions": "child:read-own,progress:read-own",
  "x-test-parent-profile-id": parentId
};

const otherParentHeaders = {
  ...parentHeaders,
  "x-test-user-id": "user-2",
  "x-test-user-email": "other-parent@example.test",
  "x-test-parent-profile-id": otherParentId
};

function childContext(params: { childId: string }) {
  return { params: Promise.resolve(params) };
}

function sessionContext(params: { childId: string; sessionId: string }) {
  return { params: Promise.resolve(params) };
}

function jsonRequest(url: string, body: unknown, headers = parentHeaders) {
  return new Request(url, {
    method: "POST",
    headers: {
      ...headers,
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

function cookieValue(response: Response) {
  return response.headers.get("set-cookie")?.match(/bacangaji_parent_gate=([^;]+)/)?.[1];
}

async function setPinAndCookie(headers = parentHeaders) {
  const response = await writePin(
    jsonRequest(
      "http://localhost/api/v1/parent/security/pin",
      {
        pin: "1234",
        confirmPin: "1234"
      },
      headers
    )
  );
  const cookie = cookieValue(response);
  expect(cookie).toEqual(expect.any(String));
  return cookie!;
}

function progressRequest(cookie: string, headers = parentHeaders) {
  return new Request(`http://localhost/api/v1/children/${childId}/progress`, {
    headers: {
      ...headers,
      cookie: `bacangaji_parent_gate=${cookie}`
    }
  });
}

async function getProgress(cookie: string, headers = parentHeaders) {
  const response = await childProgress(progressRequest(cookie, headers), childContext({ childId }));
  return { response, body: await response.json() };
}

async function completeStarterLevel() {
  const started = await startSession(
    jsonRequest(`http://localhost/api/v1/children/${childId}/game-sessions`, {
      levelId: firstLevelId
    }),
    childContext({ childId })
  );
  const startedBody = await started.json();
  const sessionId = startedBody.data.session.id as string;

  adventurePlayTest.setNow("2026-07-08T00:02:00.000Z");
  await recordAttempt(
    jsonRequest(`http://localhost/api/v1/children/${childId}/game-sessions/${sessionId}/attempts`, {
      questionId: firstQuestionId,
      selectedOptionId: correctOptionId,
      clientSequence: 1
    }),
    sessionContext({ childId, sessionId })
  );

  return sessionId;
}

describe("parent progress API", () => {
  beforeEach(() => {
    resetTestChildren();
    resetTestParentPins();
    adventurePlayTest.reset();
    adventurePlayTest.setNow("2026-07-08T00:00:00.000Z");
    seedTestChild({
      id: childId,
      parentProfileId: parentId,
      nickname: "Alya",
      birthYear: 2020,
      ageRange: "6-8",
      avatarKey: "starter-star"
    });
    adventurePlayTest.seedContent();
  });

  it("requires a parent session and valid parent gate", async () => {
    const unauthenticated = await childProgress(
      new Request(`http://localhost/api/v1/children/${childId}/progress`),
      childContext({ childId })
    );
    expect(unauthenticated.status).toBe(401);

    const noGate = await childProgress(
      new Request(`http://localhost/api/v1/children/${childId}/progress`, {
        headers: parentHeaders
      }),
      childContext({ childId })
    );
    const noGateBody = await noGate.json();

    expect(noGate.status).toBe(403);
    expect(noGateBody.error.code).toBe("PARENT_GATE_REQUIRED");
  });

  it("returns an empty safe progress summary for an owned child with no play history", async () => {
    const cookie = await setPinAndCookie();
    const { response, body } = await getProgress(cookie);

    expect(response.status).toBe(200);
    expect(body.data.progress.child.nickname).toBe("Alya");
    expect(body.data.progress.totals.completedLevels).toBe(0);
    expect(body.data.progress.totals.totalAttempts).toBe(0);
    expect(body.data.progress.latestCompletedLevel).toBeNull();
    expect(body.data.progress.recentSessions).toEqual([]);
    expect(JSON.stringify(body)).not.toContain("answerRule");
    expect(JSON.stringify(body)).not.toContain("selectedOptionId");
    expect(JSON.stringify(body)).not.toContain("correctValue");
  });

  it("returns generic not found for another parent's child", async () => {
    const cookie = await setPinAndCookie(otherParentHeaders);
    const { response, body } = await getProgress(cookie, otherParentHeaders);

    expect(response.status).toBe(404);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("summarizes LevelProgress completion, next level, attempts, and recent sessions", async () => {
    const cookie = await setPinAndCookie();
    const sessionId = await completeStarterLevel();
    const { response, body } = await getProgress(cookie);
    const progress = body.data.progress;

    expect(response.status).toBe(200);
    expect(progress.totals.completedLevels).toBe(1);
    expect(progress.totals.totalPublishedLevels).toBe(2);
    expect(progress.totals.completionPercentage).toBe(50);
    expect(progress.latestCompletedLevel).toMatchObject({
      id: firstLevelId,
      title: "Level One"
    });
    expect(progress.nextAvailableLevel).toMatchObject({
      id: secondLevelId,
      title: "Level Two"
    });
    expect(progress.totals.totalAttempts).toBe(1);
    expect(progress.totals.correctAttempts).toBe(1);
    expect(progress.totals.accuracyPercentage).toBe(100);
    expect(progress.recentSessions[0]).toMatchObject({
      id: sessionId,
      levelId: firstLevelId,
      levelTitle: "Level One",
      status: "ENDED"
    });
    expect(progress.tracks[0].zones[0].levels[0]).toMatchObject({
      id: firstLevelId,
      state: "COMPLETED"
    });
    expect(progress.tracks[0].zones[0].levels[1]).toMatchObject({
      id: secondLevelId,
      state: "AVAILABLE"
    });
    expect(JSON.stringify(body)).not.toContain("answerRule");
    expect(JSON.stringify(body)).not.toContain("selectedOptionId");
    expect(JSON.stringify(body)).not.toContain("correctValue");
  });
});
