import "server-only";

import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/server/database/prisma";
import { findChildByIdAndParentId } from "@/server/repositories/childRepository";
import {
  evaluateScreenTimePolicy,
  nextResetAt,
  usageDateForTimezone
} from "@/server/screen-time/policy";
import { ConflictError, DomainError, NotFoundError } from "@/server/errors/errors";

export type LevelState = "AVAILABLE" | "LOCKED" | "COMPLETED";
export type HeartbeatReason =
  "AVAILABLE" | "DAILY_LIMIT_REACHED" | "PARENT_OVERRIDE" | "SESSION_COMPLETED";

export type AdventureLevel = {
  id: string;
  slug: string;
  title: string;
  sortOrder: number;
  state: LevelState;
};

export type AdventureZone = {
  id: string;
  slug: string;
  title: string;
  sortOrder: number;
  levels: AdventureLevel[];
};

export type AdventureTrack = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  zones: AdventureZone[];
};

export type SanitizedGameSession = {
  id: string;
  childId: string;
  levelId: string;
  startedAt: string;
  completedAt: string | null;
  questions?: SanitizedQuestion[];
};

export type SanitizedQuestionOption = {
  id: string;
  label: string;
};

export type SanitizedQuestion = {
  id: string;
  prompt: string;
  options: SanitizedQuestionOption[];
};

export type HeartbeatResult = {
  allowed: boolean;
  reason: HeartbeatReason;
  usedSeconds: number;
  remainingSeconds: number;
  resetAt: string;
  creditedSeconds: number;
};

export type QuestionAttemptResult = {
  id: string;
  questionId: string;
  selectedOptionId: string | null;
  clientSequence: number;
  serverSequence: number;
  isCorrect: boolean;
  levelCompleted: boolean;
  sessionCompletedAt: string | null;
};

type DbClient = PrismaClient | Prisma.TransactionClient;

type ContentStatus = "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED";

type StoredTrack = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: ContentStatus;
  createdAt: Date;
  deletedAt: Date | null;
};

type StoredZone = {
  id: string;
  trackId: string;
  slug: string;
  title: string;
  sortOrder: number;
  status: ContentStatus;
  createdAt: Date;
  deletedAt: Date | null;
};

type StoredLevel = {
  id: string;
  trackId: string;
  zoneId: string;
  slug: string;
  title: string;
  sortOrder: number;
  status: ContentStatus;
  createdAt: Date;
  deletedAt: Date | null;
};

type StoredLesson = {
  id: string;
  levelId: string;
  slug: string;
  title: string;
  sortOrder: number;
  createdAt: Date;
};

type StoredQuestion = {
  id: string;
  lessonId: string;
  prompt: string;
  answerRule: Prisma.JsonValue;
  sortOrder: number;
  createdAt: Date;
};

type StoredOption = {
  id: string;
  questionId: string;
  label: string;
  value: string;
  sortOrder: number;
  createdAt: Date;
};

type StoredAttempt = {
  id: string;
  gameSessionId: string;
  childProfileId: string;
  questionId: string;
  selectedOptionId: string | null;
  clientSequence: number;
  serverSequence: number;
  isCorrect: boolean;
  createdAt: Date;
};

type StoredProgress = {
  childProfileId: string;
  levelId: string;
  completedAt: Date | null;
};

type StoredDailyUsage = {
  parentProfileId: string;
  childProfileId: string;
  usageDate: Date;
  activePlaySeconds: number;
  sessionCount: number;
  timezone: string;
  lastHeartbeatAt: Date | null;
  dailyLimitSeconds: number;
  parentOverrideUntil: Date | null;
};

type StoredSession = {
  id: string;
  childProfileId: string;
  levelId: string;
  startedAt: Date;
  completedAt: Date | null;
};

const testState = {
  tracks: [] as StoredTrack[],
  zones: [] as StoredZone[],
  levels: [] as StoredLevel[],
  lessons: [] as StoredLesson[],
  questions: [] as StoredQuestion[],
  options: [] as StoredOption[],
  attempts: [] as StoredAttempt[],
  progress: [] as StoredProgress[],
  sessions: [] as StoredSession[],
  usages: [] as StoredDailyUsage[],
  settings: new Map<
    string,
    { dailyLimitSeconds: number; timezone: string; parentOverrideUntil: Date | null }
  >(),
  now: undefined as Date | undefined,
  nextSessionNumber: 1,
  nextAttemptNumber: 1,
  locks: new Map<string, Promise<void>>()
};

function isTestMode() {
  return process.env["APP_ENV"] === "test" || process.env.NODE_ENV === "test";
}

function now() {
  return new Date((testState.now ?? new Date()).getTime());
}

function sanitizeSession(
  session: StoredSession,
  questions?: SanitizedQuestion[]
): SanitizedGameSession {
  return {
    id: session.id,
    childId: session.childProfileId,
    levelId: session.levelId,
    startedAt: session.startedAt.toISOString(),
    completedAt: session.completedAt?.toISOString() ?? null,
    ...(questions ? { questions } : {})
  };
}

function usageDateAsUtcDate(date: Date, timezone: string) {
  return new Date(`${usageDateForTimezone(date, timezone)}T00:00:00.000Z`);
}

function sameUsageDate(left: Date, right: Date) {
  return left.toISOString().slice(0, 10) === right.toISOString().slice(0, 10);
}

async function withTestChildLock<T>(childId: string, action: () => Promise<T> | T) {
  const previousLock = testState.locks.get(childId) ?? Promise.resolve();
  let releaseCurrentLock: (() => void) | undefined;
  const currentLock = previousLock.then(
    () =>
      new Promise<void>((resolve) => {
        releaseCurrentLock = resolve;
      })
  );

  testState.locks.set(childId, currentLock);
  await previousLock;

  try {
    return await action();
  } finally {
    releaseCurrentLock?.();
    if (testState.locks.get(childId) === currentLock) {
      testState.locks.delete(childId);
    }
  }
}

function orderBySortThenCreated<T extends { sortOrder?: number; createdAt: Date; id: string }>(
  items: T[]
) {
  return [...items].sort((left, right) => {
    const sortOrder = (left.sortOrder ?? 0) - (right.sortOrder ?? 0);
    if (sortOrder !== 0) return sortOrder;
    const created = left.createdAt.getTime() - right.createdAt.getTime();
    if (created !== 0) return created;
    return left.id.localeCompare(right.id);
  });
}

function orderLevelsByPublishedZone(
  publishedZones: StoredZone[],
  levels: StoredLevel[],
  trackId: string
) {
  return publishedZones.flatMap((zone) =>
    orderBySortThenCreated(
      levels.filter(
        (level) =>
          level.trackId === trackId &&
          level.zoneId === zone.id &&
          level.status === "PUBLISHED" &&
          !level.deletedAt
      )
    )
  );
}

function buildAdventureMap(
  tracks: StoredTrack[],
  zones: StoredZone[],
  levels: StoredLevel[],
  progress: StoredProgress[],
  childId: string
) {
  const completedLevelIds = new Set(
    progress
      .filter((item) => item.childProfileId === childId && item.completedAt)
      .map((item) => item.levelId)
  );

  return [...tracks]
    .filter((track) => track.status === "PUBLISHED" && !track.deletedAt)
    .sort((left, right) => {
      const created = left.createdAt.getTime() - right.createdAt.getTime();
      return created !== 0 ? created : left.id.localeCompare(right.id);
    })
    .map((track) => {
      const publishedZones = orderBySortThenCreated(
        zones.filter(
          (zone) => zone.trackId === track.id && zone.status === "PUBLISHED" && !zone.deletedAt
        )
      );
      const trackLevels = orderLevelsByPublishedZone(publishedZones, levels, track.id);
      const stateByLevelId = new Map<string, LevelState>();

      trackLevels.forEach((level, index) => {
        if (completedLevelIds.has(level.id)) {
          stateByLevelId.set(level.id, "COMPLETED");
          return;
        }

        if (index === 0 || completedLevelIds.has(trackLevels[index - 1]!.id)) {
          stateByLevelId.set(level.id, "AVAILABLE");
          return;
        }

        stateByLevelId.set(level.id, "LOCKED");
      });

      return {
        id: track.id,
        slug: track.slug,
        title: track.title,
        description: track.description,
        zones: publishedZones.map((zone) => ({
          id: zone.id,
          slug: zone.slug,
          title: zone.title,
          sortOrder: zone.sortOrder,
          levels: trackLevels
            .filter((level) => level.zoneId === zone.id)
            .map((level) => ({
              id: level.id,
              slug: level.slug,
              title: level.title,
              sortOrder: level.sortOrder,
              state: stateByLevelId.get(level.id) ?? "LOCKED"
            }))
        }))
      };
    });
}

async function assertOwnedChild(parentProfileId: string, childId: string) {
  const child = await findChildByIdAndParentId(childId, parentProfileId);
  if (!child) throw new NotFoundError();
  return child;
}

async function assertOwnedChildInDb(db: DbClient, parentProfileId: string, childId: string) {
  const child = await db.childProfile.findFirst({
    where: {
      id: childId,
      parentProfileId,
      deletedAt: null
    },
    select: { id: true }
  });
  if (!child) throw new NotFoundError();
}

async function lockChild(db: DbClient, childId: string) {
  // The child advisory lock serializes per-child operations; Read Committed observes prior commits after waiting.
  await db.$queryRaw`
    SELECT pg_advisory_xact_lock(
      hashtextextended(${childId}, 17)
    )::text AS lock_acquired
  `;
}

async function getProductionContent(db: DbClient, childId: string) {
  const tracks = await db.learningTrack.findMany({
    where: {
      status: "PUBLISHED",
      deletedAt: null
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      status: true,
      createdAt: true,
      deletedAt: true,
      zones: {
        where: {
          status: "PUBLISHED",
          deletedAt: null
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          trackId: true,
          slug: true,
          title: true,
          sortOrder: true,
          status: true,
          createdAt: true,
          deletedAt: true
        }
      },
      levels: {
        where: {
          status: "PUBLISHED",
          deletedAt: null,
          zone: {
            status: "PUBLISHED",
            deletedAt: null
          }
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          trackId: true,
          zoneId: true,
          slug: true,
          title: true,
          sortOrder: true,
          status: true,
          createdAt: true,
          deletedAt: true
        }
      }
    }
  });
  const levelIds = tracks.flatMap((track) => track.levels.map((level) => level.id));
  const progress =
    levelIds.length === 0
      ? []
      : await db.levelProgress.findMany({
          where: {
            childProfileId: childId,
            levelId: { in: levelIds },
            completedAt: { not: null }
          },
          select: {
            childProfileId: true,
            levelId: true,
            completedAt: true
          }
        });

  return buildAdventureMap(
    tracks.map((track) => ({
      id: track.id,
      slug: track.slug,
      title: track.title,
      description: track.description,
      status: track.status as ContentStatus,
      createdAt: track.createdAt,
      deletedAt: track.deletedAt
    })),
    tracks.flatMap((track) =>
      track.zones.map((zone) => ({
        id: zone.id,
        trackId: zone.trackId,
        slug: zone.slug,
        title: zone.title,
        sortOrder: zone.sortOrder,
        status: zone.status as ContentStatus,
        createdAt: zone.createdAt,
        deletedAt: zone.deletedAt
      }))
    ),
    tracks.flatMap((track) =>
      track.levels.map((level) => ({
        id: level.id,
        trackId: level.trackId,
        zoneId: level.zoneId,
        slug: level.slug,
        title: level.title,
        sortOrder: level.sortOrder,
        status: level.status as ContentStatus,
        createdAt: level.createdAt,
        deletedAt: level.deletedAt
      }))
    ),
    progress,
    childId
  );
}

async function getMapAfterOwnership(parentProfileId: string, childId: string, db: DbClient) {
  if (isTestMode() && db === prisma) {
    await assertOwnedChild(parentProfileId, childId);
    return buildAdventureMap(
      testState.tracks,
      testState.zones,
      testState.levels,
      testState.progress,
      childId
    );
  }

  await assertOwnedChildInDb(db, parentProfileId, childId);
  return getProductionContent(db, childId);
}

function findLevelInMap(map: AdventureTrack[], levelId: string) {
  for (const track of map) {
    for (const zone of track.zones) {
      const level = zone.levels.find((item) => item.id === levelId);
      if (level) return level;
    }
  }
  return null;
}

function getTestSetting(parentProfileId: string) {
  if (!testState.settings.has(parentProfileId)) {
    testState.settings.set(parentProfileId, {
      dailyLimitSeconds: 30 * 60,
      timezone: "Asia/Jakarta",
      parentOverrideUntil: null
    });
  }
  return testState.settings.get(parentProfileId)!;
}

function getTestDailyUsage(parentProfileId: string, childId: string, currentTime: Date) {
  const setting = getTestSetting(parentProfileId);
  const usageDate = usageDateAsUtcDate(currentTime, setting.timezone);
  let usage = testState.usages.find(
    (item) => item.childProfileId === childId && sameUsageDate(item.usageDate, usageDate)
  );

  if (!usage) {
    usage = {
      parentProfileId,
      childProfileId: childId,
      usageDate,
      activePlaySeconds: 0,
      sessionCount: 0,
      timezone: setting.timezone,
      lastHeartbeatAt: null,
      dailyLimitSeconds: setting.dailyLimitSeconds,
      parentOverrideUntil: setting.parentOverrideUntil
    };
    testState.usages.push(usage);
  } else {
    usage.timezone = setting.timezone;
    usage.dailyLimitSeconds = setting.dailyLimitSeconds;
    usage.parentOverrideUntil = setting.parentOverrideUntil;
  }

  return usage;
}

function screenTimePolicyForUsage(usage: StoredDailyUsage, currentTime: Date) {
  return evaluateScreenTimePolicy({
    dailyLimitSeconds: usage.dailyLimitSeconds,
    activePlaySeconds: usage.activePlaySeconds,
    timezone: usage.timezone,
    now: currentTime,
    parentOverrideUntil: usage.parentOverrideUntil
  });
}

function heartbeatCreditSeconds(
  usage: StoredDailyUsage,
  elapsedSeconds: number,
  currentTime: Date
) {
  const policy = screenTimePolicyForUsage(usage, currentTime);
  if (!policy.allowed) return 0;
  if (policy.overrideActive) return Math.min(elapsedSeconds, 45);
  return Math.min(elapsedSeconds, 45, policy.remainingSeconds);
}

function heartbeatResponse(
  usage: StoredDailyUsage,
  currentTime: Date,
  creditedSeconds: number,
  forceCompleted = false
): HeartbeatResult {
  const policy = screenTimePolicyForUsage(usage, currentTime);

  return {
    allowed: forceCompleted ? false : policy.allowed,
    reason: forceCompleted ? "SESSION_COMPLETED" : (policy.reason as HeartbeatReason),
    usedSeconds: policy.usedSeconds,
    remainingSeconds: policy.remainingSeconds,
    resetAt: policy.resetAt.toISOString(),
    creditedSeconds
  };
}

async function getOrCreateDailyUsage(
  db: DbClient,
  parentProfileId: string,
  childId: string,
  currentTime: Date
) {
  const setting = await db.parentalSetting.upsert({
    where: { parentProfileId },
    update: {},
    create: { parentProfileId },
    select: {
      dailyLimitSeconds: true,
      timezone: true,
      parentOverrideUntil: true
    }
  });
  const usageDate = usageDateAsUtcDate(currentTime, setting.timezone);

  const usage = await db.dailyPlayUsage.upsert({
    where: {
      childProfileId_usageDate: {
        childProfileId: childId,
        usageDate
      }
    },
    update: {
      timezone: setting.timezone,
      dailyLimitSeconds: setting.dailyLimitSeconds
    },
    create: {
      parentProfileId,
      childProfileId: childId,
      usageDate,
      timezone: setting.timezone,
      dailyLimitSeconds: setting.dailyLimitSeconds
    },
    select: {
      parentProfileId: true,
      childProfileId: true,
      usageDate: true,
      activePlaySeconds: true,
      sessionCount: true,
      timezone: true,
      lastHeartbeatAt: true,
      dailyLimitSeconds: true
    }
  });

  return {
    ...usage,
    parentOverrideUntil: setting.parentOverrideUntil
  };
}

function correctValueFromAnswerRule(answerRule: Prisma.JsonValue) {
  if (typeof answerRule === "object" && answerRule !== null && !Array.isArray(answerRule)) {
    const rule = answerRule as Record<string, unknown>;
    if (rule["type"] === "option_value" && typeof rule["correctValue"] === "string") {
      return rule["correctValue"];
    }
  }

  throw new DomainError("Question answer rule is not supported.");
}

function sanitizeStoredQuestions(levelId: string): SanitizedQuestion[] {
  const lessons = orderBySortThenCreated(
    testState.lessons.filter((lesson) => lesson.levelId === levelId)
  );

  return lessons.flatMap((lesson) =>
    orderBySortThenCreated(
      testState.questions.filter((question) => question.lessonId === lesson.id)
    ).map((question) => ({
      id: question.id,
      prompt: question.prompt,
      options: orderBySortThenCreated(
        testState.options.filter((option) => option.questionId === question.id)
      ).map((option) => ({
        id: option.id,
        label: option.label
      }))
    }))
  );
}

async function getSanitizedQuestionsForLevel(
  db: DbClient,
  levelId: string
): Promise<SanitizedQuestion[]> {
  const lessons = await db.learningLesson.findMany({
    where: { levelId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      questions: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          prompt: true,
          options: {
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            select: {
              id: true,
              label: true
            }
          }
        }
      }
    }
  });

  return lessons.flatMap((lesson) =>
    lesson.questions.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      options: question.options
    }))
  );
}

async function countQuestionsForLevel(db: DbClient, levelId: string) {
  return db.learningQuestion.count({
    where: {
      lesson: {
        levelId
      }
    }
  });
}

async function countCorrectSessionQuestions(db: DbClient, sessionId: string) {
  const rows = await db.questionAttempt.findMany({
    where: {
      gameSessionId: sessionId,
      isCorrect: true
    },
    distinct: ["questionId"],
    select: { questionId: true }
  });

  return rows.length;
}

export async function getAdventureMapForChild(parentProfileId: string, childId: string) {
  return getMapAfterOwnership(parentProfileId, childId, prisma);
}

export async function startGameSession(
  parentProfileId: string,
  childId: string,
  levelId: string
): Promise<SanitizedGameSession> {
  if (isTestMode()) {
    return withTestChildLock(childId, async () => {
      const map = await getMapAfterOwnership(parentProfileId, childId, prisma);
      const level = findLevelInMap(map, levelId);
      if (!level) throw new DomainError("Level is not published.");
      if (level.state === "LOCKED") throw new DomainError("Level is locked.");

      const currentTime = now();
      const usage = getTestDailyUsage(parentProfileId, childId, currentTime);
      const policy = screenTimePolicyForUsage(usage, currentTime);
      if (!policy.allowed) {
        throw new DomainError("Daily play limit has been reached.");
      }

      for (const session of testState.sessions) {
        if (session.childProfileId === childId && !session.completedAt) {
          session.completedAt = currentTime;
        }
      }

      const session: StoredSession = {
        id: `test-session-${testState.nextSessionNumber++}`,
        childProfileId: childId,
        levelId,
        startedAt: currentTime,
        completedAt: null
      };
      testState.sessions.push(session);
      usage.lastHeartbeatAt = currentTime;
      usage.sessionCount += 1;
      return sanitizeSession(session, sanitizeStoredQuestions(levelId));
    });
  }

  const session = await prisma.$transaction(async (tx) => {
    await lockChild(tx, childId);
    const map = await getMapAfterOwnership(parentProfileId, childId, tx);
    const level = findLevelInMap(map, levelId);
    if (!level) throw new DomainError("Level is not published.");
    if (level.state === "LOCKED") throw new DomainError("Level is locked.");

    const currentTime = now();
    const usage = await getOrCreateDailyUsage(tx, parentProfileId, childId, currentTime);
    const policy = screenTimePolicyForUsage(usage, currentTime);
    if (!policy.allowed) {
      throw new DomainError("Daily play limit has been reached.");
    }

    await tx.gameSession.updateMany({
      where: {
        childProfileId: childId,
        completedAt: null
      },
      data: { completedAt: currentTime }
    });

    const created = await tx.gameSession.create({
      data: {
        childProfileId: childId,
        levelId,
        startedAt: currentTime
      },
      select: {
        id: true,
        childProfileId: true,
        levelId: true,
        startedAt: true,
        completedAt: true
      }
    });

    await tx.dailyPlayUsage.update({
      where: {
        childProfileId_usageDate: {
          childProfileId: childId,
          usageDate: usage.usageDate
        }
      },
      data: {
        lastHeartbeatAt: currentTime,
        sessionCount: { increment: 1 }
      }
    });

    return {
      ...created,
      questions: await getSanitizedQuestionsForLevel(tx, levelId)
    };
  });

  return sanitizeSession(
    {
      id: session.id,
      childProfileId: session.childProfileId,
      levelId: session.levelId,
      startedAt: session.startedAt,
      completedAt: session.completedAt
    },
    session.questions
  );
}

function attemptResult(
  attempt: StoredAttempt,
  session: Pick<StoredSession, "completedAt">
): QuestionAttemptResult {
  return {
    id: attempt.id,
    questionId: attempt.questionId,
    selectedOptionId: attempt.selectedOptionId,
    clientSequence: attempt.clientSequence,
    serverSequence: attempt.serverSequence,
    isCorrect: attempt.isCorrect,
    levelCompleted: Boolean(session.completedAt),
    sessionCompletedAt: session.completedAt?.toISOString() ?? null
  };
}

function assertDuplicateAttemptMatches(
  attempt: Pick<StoredAttempt, "questionId" | "selectedOptionId">,
  questionId: string,
  selectedOptionId: string
) {
  if (attempt.questionId !== questionId || attempt.selectedOptionId !== selectedOptionId) {
    throw new ConflictError("Client sequence was already used for a different attempt.");
  }
}

function completeTestLevelIfReady(session: StoredSession, currentTime: Date) {
  const lessonIds = testState.lessons
    .filter((lesson) => lesson.levelId === session.levelId)
    .map((lesson) => lesson.id);
  const questionIds = testState.questions
    .filter((question) => lessonIds.includes(question.lessonId))
    .map((question) => question.id);

  if (questionIds.length === 0) return;

  const correctQuestionIds = new Set(
    testState.attempts
      .filter(
        (attempt) =>
          attempt.gameSessionId === session.id &&
          attempt.isCorrect &&
          questionIds.includes(attempt.questionId)
      )
      .map((attempt) => attempt.questionId)
  );

  if (correctQuestionIds.size !== questionIds.length) return;

  session.completedAt ??= currentTime;
  const existingProgress = testState.progress.find(
    (item) => item.childProfileId === session.childProfileId && item.levelId === session.levelId
  );
  if (existingProgress) {
    existingProgress.completedAt ??= currentTime;
    return;
  }

  testState.progress.push({
    childProfileId: session.childProfileId,
    levelId: session.levelId,
    completedAt: currentTime
  });
}

export async function recordQuestionAttempt(
  parentProfileId: string,
  childId: string,
  sessionId: string,
  input: {
    questionId: string;
    selectedOptionId: string;
    clientSequence: number;
  }
): Promise<QuestionAttemptResult> {
  if (isTestMode()) {
    return withTestChildLock(childId, async () => {
      await assertOwnedChild(parentProfileId, childId);
      const session = testState.sessions.find(
        (item) => item.id === sessionId && item.childProfileId === childId
      );
      if (!session) throw new NotFoundError();
      if (session.completedAt) throw new DomainError("Game session is already completed.");

      const existingAttempt = testState.attempts.find(
        (attempt) =>
          attempt.gameSessionId === sessionId && attempt.clientSequence === input.clientSequence
      );
      if (existingAttempt) {
        assertDuplicateAttemptMatches(existingAttempt, input.questionId, input.selectedOptionId);
        return attemptResult(existingAttempt, session);
      }

      const question = testState.questions.find((item) => item.id === input.questionId);
      const lesson = question
        ? testState.lessons.find((item) => item.id === question.lessonId)
        : undefined;
      if (!question || lesson?.levelId !== session.levelId) {
        throw new DomainError("Question does not belong to this session level.");
      }

      const selectedOption = testState.options.find(
        (item) => item.id === input.selectedOptionId && item.questionId === question.id
      );
      if (!selectedOption) throw new DomainError("Selected option does not belong to question.");

      const serverSequence =
        Math.max(
          0,
          ...testState.attempts
            .filter((attempt) => attempt.gameSessionId === sessionId)
            .map((attempt) => attempt.serverSequence)
        ) + 1;
      const attempt: StoredAttempt = {
        id: `test-attempt-${testState.nextAttemptNumber++}`,
        gameSessionId: sessionId,
        childProfileId: childId,
        questionId: question.id,
        selectedOptionId: selectedOption.id,
        clientSequence: input.clientSequence,
        serverSequence,
        isCorrect: selectedOption.value === correctValueFromAnswerRule(question.answerRule),
        createdAt: now()
      };

      testState.attempts.push(attempt);
      completeTestLevelIfReady(session, attempt.createdAt);

      return attemptResult(attempt, session);
    });
  }

  return prisma.$transaction(async (tx) => {
    await lockChild(tx, childId);
    await assertOwnedChildInDb(tx, parentProfileId, childId);

    const session = await tx.gameSession.findFirst({
      where: {
        id: sessionId,
        childProfileId: childId
      },
      select: {
        id: true,
        childProfileId: true,
        levelId: true,
        completedAt: true
      }
    });
    if (!session) throw new NotFoundError();
    if (session.completedAt) throw new DomainError("Game session is already completed.");

    const existingAttempt = await tx.questionAttempt.findUnique({
      where: {
        gameSessionId_clientSequence: {
          gameSessionId: sessionId,
          clientSequence: input.clientSequence
        }
      },
      select: {
        id: true,
        questionId: true,
        selectedOptionId: true,
        clientSequence: true,
        serverSequence: true,
        isCorrect: true,
        createdAt: true
      }
    });
    if (existingAttempt) {
      assertDuplicateAttemptMatches(existingAttempt, input.questionId, input.selectedOptionId);
      return {
        id: existingAttempt.id,
        questionId: existingAttempt.questionId,
        selectedOptionId: existingAttempt.selectedOptionId,
        clientSequence: existingAttempt.clientSequence,
        serverSequence: existingAttempt.serverSequence,
        isCorrect: existingAttempt.isCorrect,
        levelCompleted: false,
        sessionCompletedAt: null
      };
    }

    const question = await tx.learningQuestion.findFirst({
      where: {
        id: input.questionId,
        lesson: {
          levelId: session.levelId
        }
      },
      select: {
        id: true,
        answerRule: true
      }
    });
    if (!question) throw new DomainError("Question does not belong to this session level.");

    const selectedOption = await tx.questionOption.findFirst({
      where: {
        id: input.selectedOptionId,
        questionId: question.id
      },
      select: {
        id: true,
        value: true
      }
    });
    if (!selectedOption) throw new DomainError("Selected option does not belong to question.");

    const maxSequence = await tx.questionAttempt.aggregate({
      where: { gameSessionId: sessionId },
      _max: { serverSequence: true }
    });
    const serverSequence = (maxSequence._max.serverSequence ?? 0) + 1;
    const createdAt = now();
    const attempt = await tx.questionAttempt.create({
      data: {
        gameSessionId: sessionId,
        childProfileId: childId,
        questionId: question.id,
        selectedOptionId: selectedOption.id,
        clientSequence: input.clientSequence,
        serverSequence,
        isCorrect: selectedOption.value === correctValueFromAnswerRule(question.answerRule),
        createdAt
      },
      select: {
        id: true,
        questionId: true,
        selectedOptionId: true,
        clientSequence: true,
        serverSequence: true,
        isCorrect: true
      }
    });

    let completedAt: Date | null = null;
    const questionCount = await countQuestionsForLevel(tx, session.levelId);
    if (questionCount > 0) {
      const correctCount = await countCorrectSessionQuestions(tx, sessionId);
      if (correctCount === questionCount) {
        const completed = await tx.gameSession.update({
          where: { id: sessionId },
          data: { completedAt: createdAt },
          select: { completedAt: true }
        });
        completedAt = completed.completedAt;

        await tx.levelProgress.upsert({
          where: {
            childProfileId_levelId: {
              childProfileId: childId,
              levelId: session.levelId
            }
          },
          update: {
            completedAt,
            bestScore: 100,
            idempotencyKey: `level-progress:${childId}:${session.levelId}`
          },
          create: {
            childProfileId: childId,
            levelId: session.levelId,
            completedAt,
            bestScore: 100,
            idempotencyKey: `level-progress:${childId}:${session.levelId}`
          }
        });
      }
    }

    return {
      id: attempt.id,
      questionId: attempt.questionId,
      selectedOptionId: attempt.selectedOptionId,
      clientSequence: attempt.clientSequence,
      serverSequence: attempt.serverSequence,
      isCorrect: attempt.isCorrect,
      levelCompleted: Boolean(completedAt),
      sessionCompletedAt: completedAt?.toISOString() ?? null
    };
  });
}

export async function heartbeatGameSession(
  parentProfileId: string,
  childId: string,
  sessionId: string
): Promise<HeartbeatResult> {
  if (isTestMode()) {
    return withTestChildLock(childId, async () => {
      await assertOwnedChild(parentProfileId, childId);
      const currentTime = now();
      const usage = getTestDailyUsage(parentProfileId, childId, currentTime);
      const session = testState.sessions.find(
        (item) => item.id === sessionId && item.childProfileId === childId
      );
      if (!session) throw new NotFoundError();
      if (session.completedAt) return heartbeatResponse(usage, currentTime, 0, true);

      const previousHeartbeat = usage.lastHeartbeatAt;
      let creditedSeconds = 0;
      if (previousHeartbeat && previousHeartbeat.getTime() > session.startedAt.getTime()) {
        const elapsedSeconds = Math.max(
          0,
          Math.floor((currentTime.getTime() - previousHeartbeat.getTime()) / 1000)
        );
        creditedSeconds = heartbeatCreditSeconds(usage, elapsedSeconds, currentTime);
        usage.activePlaySeconds += creditedSeconds;
      }

      usage.lastHeartbeatAt = currentTime;
      const policy = screenTimePolicyForUsage(usage, currentTime);
      if (!policy.overrideActive && usage.activePlaySeconds >= usage.dailyLimitSeconds) {
        session.completedAt = currentTime;
      }

      return heartbeatResponse(usage, currentTime, creditedSeconds);
    });
  }

  return prisma.$transaction(async (tx) => {
    await lockChild(tx, childId);
    await assertOwnedChildInDb(tx, parentProfileId, childId);
    const currentTime = now();
    const usage = await getOrCreateDailyUsage(tx, parentProfileId, childId, currentTime);
    const session = await tx.gameSession.findFirst({
      where: {
        id: sessionId,
        childProfileId: childId
      },
      select: {
        id: true,
        startedAt: true,
        completedAt: true
      }
    });
    if (!session) throw new NotFoundError();
    if (session.completedAt) return heartbeatResponse(usage, currentTime, 0, true);

    let creditedSeconds = 0;
    if (usage.lastHeartbeatAt && usage.lastHeartbeatAt.getTime() > session.startedAt.getTime()) {
      const elapsedSeconds = Math.max(
        0,
        Math.floor((currentTime.getTime() - usage.lastHeartbeatAt.getTime()) / 1000)
      );
      creditedSeconds = heartbeatCreditSeconds(usage, elapsedSeconds, currentTime);
    }

    const updatedUsage = await tx.dailyPlayUsage.update({
      where: {
        childProfileId_usageDate: {
          childProfileId: childId,
          usageDate: usage.usageDate
        }
      },
      data: {
        activePlaySeconds: { increment: creditedSeconds },
        lastHeartbeatAt: currentTime
      },
      select: {
        parentProfileId: true,
        childProfileId: true,
        usageDate: true,
        activePlaySeconds: true,
        sessionCount: true,
        timezone: true,
        lastHeartbeatAt: true,
        dailyLimitSeconds: true
      }
    });
    const updatedUsageWithOverride = {
      ...updatedUsage,
      parentOverrideUntil: usage.parentOverrideUntil
    };

    const policy = screenTimePolicyForUsage(updatedUsageWithOverride, currentTime);
    if (
      !policy.overrideActive &&
      updatedUsage.activePlaySeconds >= updatedUsage.dailyLimitSeconds
    ) {
      await tx.gameSession.updateMany({
        where: {
          id: sessionId,
          childProfileId: childId,
          completedAt: null
        },
        data: { completedAt: currentTime }
      });
    }

    return heartbeatResponse(updatedUsageWithOverride, currentTime, creditedSeconds);
  });
}

export async function endGameSession(
  parentProfileId: string,
  childId: string,
  sessionId: string
): Promise<SanitizedGameSession> {
  if (isTestMode()) {
    return withTestChildLock(childId, async () => {
      await assertOwnedChild(parentProfileId, childId);
      const session = testState.sessions.find(
        (item) => item.id === sessionId && item.childProfileId === childId
      );
      if (!session) throw new NotFoundError();
      session.completedAt ??= now();
      return sanitizeSession(session);
    });
  }

  const session = await prisma.$transaction(async (tx) => {
    await lockChild(tx, childId);
    await assertOwnedChildInDb(tx, parentProfileId, childId);
    const existing = await tx.gameSession.findFirst({
      where: {
        id: sessionId,
        childProfileId: childId
      },
      select: {
        id: true,
        childProfileId: true,
        levelId: true,
        startedAt: true,
        completedAt: true
      }
    });
    if (!existing) throw new NotFoundError();
    if (existing.completedAt) return existing;

    return tx.gameSession.update({
      where: { id: sessionId },
      data: { completedAt: now() },
      select: {
        id: true,
        childProfileId: true,
        levelId: true,
        startedAt: true,
        completedAt: true
      }
    });
  });

  return sanitizeSession({
    id: session.id,
    childProfileId: session.childProfileId,
    levelId: session.levelId,
    startedAt: session.startedAt,
    completedAt: session.completedAt
  });
}

export const adventurePlayTest = {
  reset() {
    testState.tracks = [];
    testState.zones = [];
    testState.levels = [];
    testState.lessons = [];
    testState.questions = [];
    testState.options = [];
    testState.attempts = [];
    testState.progress = [];
    testState.sessions = [];
    testState.usages = [];
    testState.settings.clear();
    testState.now = undefined;
    testState.nextSessionNumber = 1;
    testState.nextAttemptNumber = 1;
    testState.locks.clear();
  },
  setNow(value: string | Date) {
    testState.now = typeof value === "string" ? new Date(value) : new Date(value.getTime());
  },
  setParentSetting(
    parentProfileId: string,
    setting: {
      dailyLimitSeconds: number;
      timezone?: string;
      parentOverrideUntil?: string | Date | null;
    }
  ) {
    testState.settings.set(parentProfileId, {
      dailyLimitSeconds: setting.dailyLimitSeconds,
      timezone: setting.timezone ?? "Asia/Jakarta",
      parentOverrideUntil:
        typeof setting.parentOverrideUntil === "string"
          ? new Date(setting.parentOverrideUntil)
          : (setting.parentOverrideUntil ?? null)
    });
  },
  seedContent(input?: {
    trackStatus?: ContentStatus;
    zoneStatus?: ContentStatus;
    firstLevelStatus?: ContentStatus;
    secondLevelStatus?: ContentStatus;
  }) {
    const createdAt = new Date("2026-07-08T00:00:00.000Z");
    testState.tracks.push({
      id: "11111111-1111-4111-8111-111111111111",
      slug: "track-one",
      title: "Track One",
      description: "Test track",
      status: input?.trackStatus ?? "PUBLISHED",
      createdAt,
      deletedAt: null
    });
    testState.zones.push({
      id: "22222222-2222-4222-8222-222222222222",
      trackId: "11111111-1111-4111-8111-111111111111",
      slug: "zone-one",
      title: "Zone One",
      sortOrder: 1,
      status: input?.zoneStatus ?? "PUBLISHED",
      createdAt,
      deletedAt: null
    });
    testState.levels.push(
      {
        id: "33333333-3333-4333-8333-333333333331",
        trackId: "11111111-1111-4111-8111-111111111111",
        zoneId: "22222222-2222-4222-8222-222222222222",
        slug: "level-one",
        title: "Level One",
        sortOrder: 1,
        status: input?.firstLevelStatus ?? "PUBLISHED",
        createdAt,
        deletedAt: null
      },
      {
        id: "33333333-3333-4333-8333-333333333332",
        trackId: "11111111-1111-4111-8111-111111111111",
        zoneId: "22222222-2222-4222-8222-222222222222",
        slug: "level-two",
        title: "Level Two",
        sortOrder: 2,
        status: input?.secondLevelStatus ?? "PUBLISHED",
        createdAt: new Date("2026-07-08T00:01:00.000Z"),
        deletedAt: null
      }
    );
    testState.lessons.push({
      id: "44444444-4444-4444-8444-444444444441",
      levelId: "33333333-3333-4333-8333-333333333331",
      slug: "starter-lesson",
      title: "Starter Lesson",
      sortOrder: 1,
      createdAt
    });
    testState.questions.push({
      id: "55555555-5555-4555-8555-555555555551",
      lessonId: "44444444-4444-4444-8444-444444444441",
      prompt: "Which balloon says ba?",
      answerRule: { type: "option_value", correctValue: "ba" },
      sortOrder: 1,
      createdAt
    });
    testState.options.push(
      {
        id: "66666666-6666-4666-8666-666666666661",
        questionId: "55555555-5555-4555-8555-555555555551",
        label: "ba",
        value: "ba",
        sortOrder: 1,
        createdAt
      },
      {
        id: "66666666-6666-4666-8666-666666666662",
        questionId: "55555555-5555-4555-8555-555555555551",
        label: "ma",
        value: "ma",
        sortOrder: 2,
        createdAt
      }
    );
  },
  seedSecondZone() {
    const trackId = "11111111-1111-4111-8111-111111111111";
    const zoneId = "22222222-2222-4222-8222-222222222223";
    testState.zones.push({
      id: zoneId,
      trackId,
      slug: "zone-two",
      title: "Zone Two",
      sortOrder: 2,
      status: "PUBLISHED",
      createdAt: new Date("2026-07-08T00:02:00.000Z"),
      deletedAt: null
    });
    testState.levels.push({
      id: "33333333-3333-4333-8333-333333333333",
      trackId,
      zoneId,
      slug: "level-three",
      title: "Level Three",
      sortOrder: 1,
      status: "PUBLISHED",
      createdAt: new Date("2026-07-08T00:03:00.000Z"),
      deletedAt: null
    });
  },
  seedSecondLevelQuestion() {
    const createdAt = new Date("2026-07-08T00:04:00.000Z");
    testState.lessons.push({
      id: "44444444-4444-4444-8444-444444444442",
      levelId: "33333333-3333-4333-8333-333333333332",
      slug: "second-lesson",
      title: "Second Lesson",
      sortOrder: 1,
      createdAt
    });
    testState.questions.push({
      id: "55555555-5555-4555-8555-555555555552",
      lessonId: "44444444-4444-4444-8444-444444444442",
      prompt: "Which option says sa?",
      answerRule: { type: "option_value", correctValue: "sa" },
      sortOrder: 1,
      createdAt
    });
    testState.options.push({
      id: "66666666-6666-4666-8666-666666666663",
      questionId: "55555555-5555-4555-8555-555555555552",
      label: "sa",
      value: "sa",
      sortOrder: 1,
      createdAt
    });
  },
  completeLevel(childProfileId: string, levelId: string) {
    testState.progress.push({
      childProfileId,
      levelId,
      completedAt: now()
    });
  },
  seedUsage(input: {
    parentProfileId: string;
    childProfileId: string;
    activePlaySeconds: number;
    dailyLimitSeconds: number;
    lastHeartbeatAt?: string | Date | null;
    timezone?: string;
    parentOverrideUntil?: string | Date | null;
  }) {
    const currentTime = now();
    const timezone = input.timezone ?? "Asia/Jakarta";
    const parentOverrideUntil =
      typeof input.parentOverrideUntil === "string"
        ? new Date(input.parentOverrideUntil)
        : (input.parentOverrideUntil ?? null);
    testState.settings.set(input.parentProfileId, {
      dailyLimitSeconds: input.dailyLimitSeconds,
      timezone,
      parentOverrideUntil
    });
    testState.usages.push({
      parentProfileId: input.parentProfileId,
      childProfileId: input.childProfileId,
      usageDate: usageDateAsUtcDate(currentTime, timezone),
      activePlaySeconds: input.activePlaySeconds,
      sessionCount: 0,
      timezone,
      lastHeartbeatAt:
        typeof input.lastHeartbeatAt === "string"
          ? new Date(input.lastHeartbeatAt)
          : (input.lastHeartbeatAt ?? null),
      dailyLimitSeconds: input.dailyLimitSeconds,
      parentOverrideUntil
    });
  },
  sessions() {
    return testState.sessions.map((session) => sanitizeSession(session));
  },
  attempts() {
    return testState.attempts.map((attempt) => ({ ...attempt }));
  },
  progress() {
    return testState.progress.map((progress) => ({ ...progress }));
  },
  usage(parentProfileId: string, childProfileId: string) {
    return testState.usages.find(
      (item) => item.parentProfileId === parentProfileId && item.childProfileId === childProfileId
    );
  },
  resetAtFor(date: string | Date, timezone = "Asia/Jakarta") {
    const value = typeof date === "string" ? new Date(date) : date;
    return nextResetAt(value, timezone).toISOString();
  }
};
