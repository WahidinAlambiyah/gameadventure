import { beforeEach, describe, expect, it } from "vitest";
import { GET as adventureMap } from "@/app/api/v1/children/[childId]/adventure-map/route";
import { POST as startSession } from "@/app/api/v1/children/[childId]/game-sessions/route";
import { POST as recordAttempt } from "@/app/api/v1/children/[childId]/game-sessions/[sessionId]/attempts/route";
import { POST as heartbeatSession } from "@/app/api/v1/children/[childId]/game-sessions/[sessionId]/heartbeat/route";
import { POST as endSession } from "@/app/api/v1/children/[childId]/game-sessions/[sessionId]/end/route";
import { resetTestChildren, seedTestChild } from "@/server/repositories/childRepository";
import { adventurePlayTest } from "@/server/services/adventurePlay";

const childId = "child-1";
const parentId = "parent-1";
const otherParentId = "parent-2";
const firstLevelId = "33333333-3333-4333-8333-333333333331";
const secondLevelId = "33333333-3333-4333-8333-333333333332";
const thirdLevelId = "33333333-3333-4333-8333-333333333333";
const firstQuestionId = "55555555-5555-4555-8555-555555555551";
const secondLevelQuestionId = "55555555-5555-4555-8555-555555555552";
const correctOptionId = "66666666-6666-4666-8666-666666666661";
const incorrectOptionId = "66666666-6666-4666-8666-666666666662";
const secondLevelOptionId = "66666666-6666-4666-8666-666666666663";

const parentHeaders = {
  "x-test-user-id": "user-1",
  "x-test-user-email": "parent@example.test",
  "x-test-roles": "PARENT",
  "x-test-permissions": "child:read-own",
  "x-test-parent-profile-id": parentId
};

function childContext(params: { childId: string }) {
  return { params: Promise.resolve(params) };
}

function sessionContext(params: { childId: string; sessionId: string }) {
  return { params: Promise.resolve(params) };
}

function request(url: string, body?: unknown, headers = parentHeaders) {
  return new Request(url, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      ...headers,
      ...(body === undefined ? {} : { "content-type": "application/json" })
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}

async function start(levelId = firstLevelId) {
  const response = await startSession(
    request(`http://localhost/api/v1/children/${childId}/game-sessions`, { levelId }),
    childContext({ childId })
  );
  const body = await response.json();
  return { response, body };
}

async function heartbeat(sessionId: string, body: unknown = {}) {
  const response = await heartbeatSession(
    request(
      `http://localhost/api/v1/children/${childId}/game-sessions/${sessionId}/heartbeat`,
      body
    ),
    sessionContext({ childId, sessionId })
  );
  return { response, body: await response.json() };
}

async function attempt(
  sessionId: string,
  body: {
    questionId?: string;
    selectedOptionId?: string;
    clientSequence?: number;
  },
  headers = parentHeaders
) {
  const response = await recordAttempt(
    request(
      `http://localhost/api/v1/children/${childId}/game-sessions/${sessionId}/attempts`,
      {
        questionId: body.questionId ?? firstQuestionId,
        selectedOptionId: body.selectedOptionId ?? correctOptionId,
        clientSequence: body.clientSequence ?? 1
      },
      headers
    ),
    sessionContext({ childId, sessionId })
  );
  return { response, body: await response.json() };
}

describe("child adventure map and play session API", () => {
  beforeEach(() => {
    resetTestChildren();
    adventurePlayTest.reset();
    adventurePlayTest.setNow("2026-07-08T00:00:00.000Z");
    seedTestChild({
      id: childId,
      parentProfileId: parentId,
      nickname: "Alya",
      birthYear: 2020,
      avatarKey: "starter-star"
    });
    adventurePlayTest.seedContent();
  });

  it("denies another parent's child without leaking ownership details", async () => {
    const response = await adventureMap(
      request("http://localhost/api/v1/children/child-1/adventure-map", undefined, {
        ...parentHeaders,
        "x-test-parent-profile-id": otherParentId
      }),
      childContext({ childId })
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("denies unpublished levels on session start", async () => {
    adventurePlayTest.reset();
    adventurePlayTest.setNow("2026-07-08T00:00:00.000Z");
    adventurePlayTest.seedContent({ firstLevelStatus: "DRAFT" });

    const { response, body } = await start(firstLevelId);

    expect(response.status).toBe(422);
    expect(body.error.code).toBe("DOMAIN_ERROR");
  });

  it("denies locked levels on session start", async () => {
    const { response, body } = await start(secondLevelId);

    expect(response.status).toBe(422);
    expect(body.error.code).toBe("DOMAIN_ERROR");
  });

  it("marks the first published level in a track available", async () => {
    const response = await adventureMap(
      request("http://localhost/api/v1/children/child-1/adventure-map"),
      childContext({ childId })
    );
    const body = await response.json();
    const [firstLevel, secondLevel] = body.data.tracks[0].zones[0].levels;

    expect(response.status).toBe(200);
    expect(firstLevel.state).toBe("AVAILABLE");
    expect(secondLevel.state).toBe("LOCKED");
  });

  it("uses zone order before level order for multi-zone progression", async () => {
    adventurePlayTest.seedSecondZone();
    adventurePlayTest.completeLevel(childId, firstLevelId);

    const afterFirst = await adventureMap(
      request("http://localhost/api/v1/children/child-1/adventure-map"),
      childContext({ childId })
    );
    const afterFirstBody = await afterFirst.json();

    expect(afterFirstBody.data.tracks[0].zones[0].levels[1].id).toBe(secondLevelId);
    expect(afterFirstBody.data.tracks[0].zones[0].levels[1].state).toBe("AVAILABLE");
    expect(afterFirstBody.data.tracks[0].zones[1].levels[0].id).toBe(thirdLevelId);
    expect(afterFirstBody.data.tracks[0].zones[1].levels[0].state).toBe("LOCKED");

    adventurePlayTest.completeLevel(childId, secondLevelId);
    const afterSecond = await adventureMap(
      request("http://localhost/api/v1/children/child-1/adventure-map"),
      childContext({ childId })
    );
    const afterSecondBody = await afterSecond.json();

    expect(afterSecondBody.data.tracks[0].zones[1].levels[0].state).toBe("AVAILABLE");
  });

  it("starts a session and closes the previous incomplete session for that child", async () => {
    const first = await start();
    expect(first.response.status).toBe(201);

    adventurePlayTest.setNow("2026-07-08T00:01:00.000Z");
    const second = await start();
    const sessions = adventurePlayTest.sessions();

    expect(second.response.status).toBe(201);
    expect(sessions).toHaveLength(2);
    expect(sessions[0].completedAt).toBe("2026-07-08T00:01:00.000Z");
    expect(sessions[1].completedAt).toBeNull();
  });

  it("allows session start after the normal daily limit when parent override is active", async () => {
    adventurePlayTest.seedUsage({
      parentProfileId: parentId,
      childProfileId: childId,
      activePlaySeconds: 50,
      dailyLimitSeconds: 50,
      parentOverrideUntil: "2026-07-08T00:10:00.000Z"
    });

    const { response, body } = await start();

    expect(response.status).toBe(201);
    expect(body.data.session.id).toEqual(expect.any(String));
  });

  it("credits zero seconds on the first heartbeat", async () => {
    const started = await start();
    const sessionId = started.body.data.session.id;

    adventurePlayTest.setNow("2026-07-08T00:00:30.000Z");
    const result = await heartbeat(sessionId);

    expect(result.response.status).toBe(200);
    expect(result.body.data.heartbeat.creditedSeconds).toBe(0);
    expect(result.body.data.heartbeat.usedSeconds).toBe(0);
  });

  it("uses server elapsed time only and ignores client duration fields", async () => {
    const started = await start();
    const sessionId = started.body.data.session.id;

    adventurePlayTest.setNow("2026-07-08T00:00:30.000Z");
    await heartbeat(sessionId);
    adventurePlayTest.setNow("2026-07-08T00:00:42.000Z");
    const result = await heartbeat(sessionId, { durationSeconds: 9999 });

    expect(result.body.data.heartbeat.creditedSeconds).toBe(12);
    expect(result.body.data.heartbeat.usedSeconds).toBe(12);
  });

  it("caps heartbeat credit at 45 seconds", async () => {
    const started = await start();
    const sessionId = started.body.data.session.id;

    adventurePlayTest.setNow("2026-07-08T00:00:01.000Z");
    await heartbeat(sessionId);
    adventurePlayTest.setNow("2026-07-08T00:02:01.000Z");
    const result = await heartbeat(sessionId);

    expect(result.body.data.heartbeat.creditedSeconds).toBe(45);
    expect(result.body.data.heartbeat.usedSeconds).toBe(45);
  });

  it("never exceeds the daily limit and completes the session when the limit is reached", async () => {
    adventurePlayTest.setParentSetting(parentId, { dailyLimitSeconds: 50 });
    adventurePlayTest.seedUsage({
      parentProfileId: parentId,
      childProfileId: childId,
      activePlaySeconds: 40,
      dailyLimitSeconds: 50
    });
    const started = await start();
    const sessionId = started.body.data.session.id;

    adventurePlayTest.setNow("2026-07-08T00:00:01.000Z");
    await heartbeat(sessionId);
    adventurePlayTest.setNow("2026-07-08T00:01:01.000Z");
    const result = await heartbeat(sessionId);
    const session = adventurePlayTest.sessions().find((item) => item.id === sessionId);

    expect(result.body.data.heartbeat.creditedSeconds).toBe(10);
    expect(result.body.data.heartbeat.usedSeconds).toBe(50);
    expect(result.body.data.heartbeat.remainingSeconds).toBe(0);
    expect(result.body.data.heartbeat.allowed).toBe(false);
    expect(session?.completedAt).toBe("2026-07-08T00:01:01.000Z");
  });

  it("continues heartbeat during active override without closing at the normal limit", async () => {
    adventurePlayTest.seedUsage({
      parentProfileId: parentId,
      childProfileId: childId,
      activePlaySeconds: 48,
      dailyLimitSeconds: 50,
      parentOverrideUntil: "2026-07-08T00:10:00.000Z"
    });
    const started = await start();
    const sessionId = started.body.data.session.id;

    adventurePlayTest.setNow("2026-07-08T00:00:01.000Z");
    await heartbeat(sessionId);
    adventurePlayTest.setNow("2026-07-08T00:01:01.000Z");
    const result = await heartbeat(sessionId);
    const session = adventurePlayTest.sessions().find((item) => item.id === sessionId);

    expect(result.body.data.heartbeat.creditedSeconds).toBe(45);
    expect(result.body.data.heartbeat.usedSeconds).toBe(93);
    expect(result.body.data.heartbeat.remainingSeconds).toBe(0);
    expect(result.body.data.heartbeat.allowed).toBe(true);
    expect(result.body.data.heartbeat.reason).toBe("PARENT_OVERRIDE");
    expect(session?.completedAt).toBeNull();
  });

  it("returns sanitized questions when starting a session", async () => {
    const { response, body } = await start();

    expect(response.status).toBe(201);
    expect(body.data.session.questions).toEqual([
      {
        id: firstQuestionId,
        prompt: "Which balloon says ba?",
        options: [
          { id: correctOptionId, label: "ba" },
          { id: incorrectOptionId, label: "ma" }
        ]
      }
    ]);
  });

  it("starts an unlocked no-question level without auto-completing progress", async () => {
    adventurePlayTest.completeLevel(childId, firstLevelId);

    const { response, body } = await start(secondLevelId);
    const session = adventurePlayTest.sessions().find((item) => item.id === body.data.session.id);
    const progress = adventurePlayTest.progress();

    expect(response.status).toBe(201);
    expect(body.data.session.questions).toEqual([]);
    expect(session?.completedAt).toBeNull();
    expect(progress).toHaveLength(1);
    expect(progress.some((item) => item.levelId === secondLevelId)).toBe(false);
  });

  it("keeps the level active after an incorrect attempt and accepts a later correct answer", async () => {
    const started = await start();
    const sessionId = started.body.data.session.id;

    const result = await attempt(sessionId, {
      selectedOptionId: incorrectOptionId,
      clientSequence: 1
    });
    const session = adventurePlayTest.sessions().find((item) => item.id === sessionId);

    expect(result.response.status).toBe(200);
    expect(result.body.data.attempt.isCorrect).toBe(false);
    expect(result.body.data.attempt.levelCompleted).toBe(false);
    expect(session?.completedAt).toBeNull();
    expect(adventurePlayTest.progress()).toHaveLength(0);

    const corrected = await attempt(sessionId, {
      selectedOptionId: correctOptionId,
      clientSequence: 2
    });

    expect(corrected.response.status).toBe(200);
    expect(corrected.body.data.attempt.isCorrect).toBe(true);
    expect(corrected.body.data.attempt.levelCompleted).toBe(true);
    expect(adventurePlayTest.progress()).toHaveLength(1);
  });

  it("rejects a question that does not belong to the session level", async () => {
    adventurePlayTest.seedSecondLevelQuestion();
    const started = await start();
    const sessionId = started.body.data.session.id;

    const result = await attempt(sessionId, {
      questionId: secondLevelQuestionId,
      selectedOptionId: secondLevelOptionId,
      clientSequence: 1
    });

    expect(result.response.status).toBe(422);
    expect(result.body.error.code).toBe("DOMAIN_ERROR");
  });

  it("rejects a selected option that does not belong to the question", async () => {
    adventurePlayTest.seedSecondLevelQuestion();
    const started = await start();
    const sessionId = started.body.data.session.id;

    const result = await attempt(sessionId, {
      questionId: firstQuestionId,
      selectedOptionId: secondLevelOptionId,
      clientSequence: 1
    });

    expect(result.response.status).toBe(422);
    expect(result.body.error.code).toBe("DOMAIN_ERROR");
  });

  it("rejects another parent's child session without leaking ownership details", async () => {
    const started = await start();
    const sessionId = started.body.data.session.id;

    const result = await attempt(
      sessionId,
      { selectedOptionId: correctOptionId, clientSequence: 1 },
      {
        ...parentHeaders,
        "x-test-parent-profile-id": otherParentId
      }
    );

    expect(result.response.status).toBe(404);
    expect(result.body.error.code).toBe("NOT_FOUND");
    expect(adventurePlayTest.attempts()).toHaveLength(0);
  });

  it("treats duplicate client sequences as idempotent for the same active-session attempt", async () => {
    const started = await start();
    const sessionId = started.body.data.session.id;

    const first = await attempt(sessionId, {
      selectedOptionId: incorrectOptionId,
      clientSequence: 1
    });
    const second = await attempt(sessionId, {
      selectedOptionId: incorrectOptionId,
      clientSequence: 1
    });

    expect(first.response.status).toBe(200);
    expect(second.response.status).toBe(200);
    expect(second.body.data.attempt.id).toBe(first.body.data.attempt.id);
    expect(adventurePlayTest.attempts()).toHaveLength(1);
  });

  it("completes the level and unlocks the next level after all questions are correct", async () => {
    const started = await start();
    const sessionId = started.body.data.session.id;

    adventurePlayTest.setNow("2026-07-08T00:02:00.000Z");
    const result = await attempt(sessionId, {
      selectedOptionId: correctOptionId,
      clientSequence: 1
    });
    const session = adventurePlayTest.sessions().find((item) => item.id === sessionId);
    const progress = adventurePlayTest.progress();

    expect(result.response.status).toBe(200);
    expect(result.body.data.attempt.isCorrect).toBe(true);
    expect(result.body.data.attempt.levelCompleted).toBe(true);
    expect(result.body.data.attempt.sessionCompletedAt).toBe("2026-07-08T00:02:00.000Z");
    expect(session?.completedAt).toBe("2026-07-08T00:02:00.000Z");
    expect(progress).toHaveLength(1);
    expect(progress[0]?.levelId).toBe(firstLevelId);

    const afterCompletion = await adventureMap(
      request("http://localhost/api/v1/children/child-1/adventure-map"),
      childContext({ childId })
    );
    const afterCompletionBody = await afterCompletion.json();

    expect(afterCompletionBody.data.tracks[0].zones[0].levels[0].state).toBe("COMPLETED");
    expect(afterCompletionBody.data.tracks[0].zones[0].levels[1].state).toBe("AVAILABLE");
  });

  it("rejects attempts after the session is completed", async () => {
    const started = await start();
    const sessionId = started.body.data.session.id;

    await attempt(sessionId, {
      selectedOptionId: correctOptionId,
      clientSequence: 1
    });
    const result = await attempt(sessionId, {
      selectedOptionId: incorrectOptionId,
      clientSequence: 2
    });

    expect(result.response.status).toBe(422);
    expect(result.body.error.code).toBe("DOMAIN_ERROR");
    expect(adventurePlayTest.attempts()).toHaveLength(1);
  });

  it("ends a session idempotently without progress, reward, energy, or attempt writes", async () => {
    const started = await start();
    const sessionId = started.body.data.session.id;

    adventurePlayTest.setNow("2026-07-08T00:05:00.000Z");
    const firstEnd = await endSession(
      request(`http://localhost/api/v1/children/${childId}/game-sessions/${sessionId}/end`, {}),
      sessionContext({ childId, sessionId })
    );
    const firstBody = await firstEnd.json();

    adventurePlayTest.setNow("2026-07-08T00:06:00.000Z");
    const secondEnd = await endSession(
      request(`http://localhost/api/v1/children/${childId}/game-sessions/${sessionId}/end`, {}),
      sessionContext({ childId, sessionId })
    );
    const secondBody = await secondEnd.json();

    expect(firstEnd.status).toBe(200);
    expect(secondEnd.status).toBe(200);
    expect(firstBody.data.session.completedAt).toBe("2026-07-08T00:05:00.000Z");
    expect(secondBody.data.session.completedAt).toBe("2026-07-08T00:05:00.000Z");
  });
});
