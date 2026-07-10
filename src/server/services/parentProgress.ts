import "server-only";

import { prisma } from "@/server/database/prisma";
import { NotFoundError } from "@/server/errors/errors";
import { findChildByIdAndParentId } from "@/server/repositories/childRepository";
import { usageDateForTimezone } from "@/server/screen-time/policy";
import {
  adventurePlayTest,
  getAdventureMapForChild,
  type AdventureTrack
} from "@/server/services/adventurePlay";

type ProgressLevelState = "AVAILABLE" | "LOCKED" | "COMPLETED";

type FlatProgressLevel = {
  id: string;
  title: string;
  trackTitle: string;
  zoneTitle: string;
  state: ProgressLevelState;
};

export type ParentProgressSummary = {
  child: {
    id: string;
    nickname: string;
    ageRange: string | null;
  };
  totals: {
    completedLevels: number;
    totalPublishedLevels: number;
    completionPercentage: number;
    totalAttempts: number;
    correctAttempts: number;
    accuracyPercentage: number;
  };
  todayPlay: {
    activePlaySeconds: number;
    sessionCount: number;
  };
  lastPlayedAt: string | null;
  latestCompletedLevel: {
    id: string;
    title: string;
    trackTitle: string;
    zoneTitle: string;
    completedAt: string;
  } | null;
  nextAvailableLevel: {
    id: string;
    title: string;
    trackTitle: string;
    zoneTitle: string;
  } | null;
  tracks: Array<{
    id: string;
    title: string;
    zones: Array<{
      id: string;
      title: string;
      levels: Array<{
        id: string;
        title: string;
        state: ProgressLevelState;
        completedAt: string | null;
      }>;
    }>;
  }>;
  recentSessions: Array<{
    id: string;
    levelId: string;
    levelTitle: string;
    startedAt: string;
    endedAt: string | null;
    status: "IN_PROGRESS" | "ENDED";
  }>;
};

function isTestMode() {
  return process.env["APP_ENV"] === "test" || process.env.NODE_ENV === "test";
}

function percentage(part: number, total: number) {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

function flattenMap(tracks: AdventureTrack[]): FlatProgressLevel[] {
  return tracks.flatMap((track) =>
    track.zones.flatMap((zone) =>
      zone.levels.map((level) => ({
        id: level.id,
        title: level.title,
        trackTitle: track.title,
        zoneTitle: zone.title,
        state: level.state
      }))
    )
  );
}

function byNewestCompletedAt<T extends { completedAt: Date | string | null }>(left: T, right: T) {
  const leftTime = left.completedAt ? new Date(left.completedAt).getTime() : 0;
  const rightTime = right.completedAt ? new Date(right.completedAt).getTime() : 0;
  return rightTime - leftTime;
}

function buildSummary(input: {
  child: {
    id: string;
    nickname: string;
    ageRange?: string | null;
  };
  tracks: AdventureTrack[];
  completedProgress: Array<{
    levelId: string;
    completedAt: Date | string | null;
  }>;
  sessions: Array<{
    id: string;
    levelId: string;
    startedAt: Date | string;
    completedAt: Date | string | null;
  }>;
  totalAttempts: number;
  correctAttempts: number;
  todayPlay: {
    activePlaySeconds: number;
    sessionCount: number;
  };
}): ParentProgressSummary {
  const levels = flattenMap(input.tracks);
  const levelById = new Map(levels.map((level) => [level.id, level]));
  const completedAtByLevelId = new Map(
    input.completedProgress
      .filter((progress) => progress.completedAt && levelById.has(progress.levelId))
      .map((progress) => [progress.levelId, new Date(progress.completedAt!).toISOString()])
  );
  const completedLevels = completedAtByLevelId.size;
  const latestProgress = [...input.completedProgress]
    .filter((progress) => progress.completedAt && levelById.has(progress.levelId))
    .sort(byNewestCompletedAt)[0];
  const latestLevel = latestProgress ? levelById.get(latestProgress.levelId) : null;
  const nextAvailableLevel = levels.find((level) => level.state === "AVAILABLE") ?? null;
  const sessions = [...input.sessions].sort(
    (left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime()
  );
  const recentSessions = sessions.slice(0, 5).map((session) => {
    const level = levelById.get(session.levelId);
    const endedAt = session.completedAt ? new Date(session.completedAt).toISOString() : null;
    return {
      id: session.id,
      levelId: session.levelId,
      levelTitle: level?.title ?? "Unknown level",
      startedAt: new Date(session.startedAt).toISOString(),
      endedAt,
      status: endedAt ? ("ENDED" as const) : ("IN_PROGRESS" as const)
    };
  });

  return {
    child: {
      id: input.child.id,
      nickname: input.child.nickname,
      ageRange: input.child.ageRange ?? null
    },
    totals: {
      completedLevels,
      totalPublishedLevels: levels.length,
      completionPercentage: percentage(completedLevels, levels.length),
      totalAttempts: input.totalAttempts,
      correctAttempts: input.correctAttempts,
      accuracyPercentage: percentage(input.correctAttempts, input.totalAttempts)
    },
    todayPlay: input.todayPlay,
    lastPlayedAt: recentSessions[0]?.startedAt ?? null,
    latestCompletedLevel:
      latestProgress && latestLevel && latestProgress.completedAt
        ? {
            id: latestLevel.id,
            title: latestLevel.title,
            trackTitle: latestLevel.trackTitle,
            zoneTitle: latestLevel.zoneTitle,
            completedAt: new Date(latestProgress.completedAt).toISOString()
          }
        : null,
    nextAvailableLevel: nextAvailableLevel
      ? {
          id: nextAvailableLevel.id,
          title: nextAvailableLevel.title,
          trackTitle: nextAvailableLevel.trackTitle,
          zoneTitle: nextAvailableLevel.zoneTitle
        }
      : null,
    tracks: input.tracks.map((track) => ({
      id: track.id,
      title: track.title,
      zones: track.zones.map((zone) => ({
        id: zone.id,
        title: zone.title,
        levels: zone.levels.map((level) => ({
          id: level.id,
          title: level.title,
          state: level.state,
          completedAt: completedAtByLevelId.get(level.id) ?? null
        }))
      }))
    })),
    recentSessions
  };
}

async function getTestProgressSummary(parentProfileId: string, childId: string) {
  const child = await findChildByIdAndParentId(childId, parentProfileId);
  if (!child) throw new NotFoundError();

  const tracks = await getAdventureMapForChild(parentProfileId, childId);
  const levelIds = new Set(flattenMap(tracks).map((level) => level.id));
  const attempts = adventurePlayTest
    .attempts()
    .filter((attempt) => attempt.childProfileId === childId);
  const usage = adventurePlayTest.usage(parentProfileId, childId);

  return buildSummary({
    child,
    tracks,
    completedProgress: adventurePlayTest
      .progress()
      .filter((progress) => progress.childProfileId === childId && levelIds.has(progress.levelId)),
    sessions: adventurePlayTest.sessions().filter((session) => session.childId === childId),
    totalAttempts: attempts.length,
    correctAttempts: attempts.filter((attempt) => attempt.isCorrect).length,
    todayPlay: {
      activePlaySeconds: usage?.activePlaySeconds ?? 0,
      sessionCount: usage?.sessionCount ?? 0
    }
  });
}

async function getProductionProgressSummary(parentProfileId: string, childId: string) {
  const child = await prisma.childProfile.findFirst({
    where: {
      id: childId,
      parentProfileId,
      deletedAt: null
    },
    select: {
      id: true,
      nickname: true,
      ageRange: true
    }
  });
  if (!child) throw new NotFoundError();

  const tracks = await getAdventureMapForChild(parentProfileId, childId);
  const levelIds = flattenMap(tracks).map((level) => level.id);
  const childScope = {
    childProfileId: childId,
    childProfile: {
      parentProfileId,
      deletedAt: null
    }
  };

  const [completedProgress, sessions, totalAttempts, correctAttempts, setting] = await Promise.all([
    levelIds.length === 0
      ? []
      : prisma.levelProgress.findMany({
          where: {
            ...childScope,
            levelId: { in: levelIds },
            completedAt: { not: null }
          },
          select: {
            levelId: true,
            completedAt: true
          }
        }),
    prisma.gameSession.findMany({
      where: childScope,
      orderBy: { startedAt: "desc" },
      take: 5,
      select: {
        id: true,
        levelId: true,
        startedAt: true,
        completedAt: true
      }
    }),
    prisma.questionAttempt.count({
      where: childScope
    }),
    prisma.questionAttempt.count({
      where: {
        ...childScope,
        isCorrect: true
      }
    }),
    prisma.parentalSetting.findUnique({
      where: { parentProfileId },
      select: { timezone: true }
    })
  ]);

  const timezone = setting?.timezone ?? "Asia/Jakarta";
  const usageDate = new Date(`${usageDateForTimezone(new Date(), timezone)}T00:00:00.000Z`);
  const todayUsage = await prisma.dailyPlayUsage.findFirst({
    where: {
      parentProfileId,
      childProfileId: childId,
      usageDate
    },
    select: {
      activePlaySeconds: true,
      sessionCount: true
    }
  });

  return buildSummary({
    child,
    tracks,
    completedProgress,
    sessions,
    totalAttempts,
    correctAttempts,
    todayPlay: {
      activePlaySeconds: todayUsage?.activePlaySeconds ?? 0,
      sessionCount: todayUsage?.sessionCount ?? 0
    }
  });
}

export async function getChildProgressSummary(parentProfileId: string, childId: string) {
  if (isTestMode()) {
    return getTestProgressSummary(parentProfileId, childId);
  }

  return getProductionProgressSummary(parentProfileId, childId);
}
