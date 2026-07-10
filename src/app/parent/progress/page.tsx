import Link from "next/link";
import { requireParentPermission } from "@/server/auth/session";
import { requireParentGatePage } from "@/server/parent-gate/guard";
import { listChildrenByParentId } from "@/server/repositories/childRepository";
import {
  getChildProgressSummary,
  type ParentProgressSummary
} from "@/server/services/parentProgress";

function percentLabel(value: number) {
  return `${value}%`;
}

function minutesLabel(seconds: number) {
  if (seconds <= 0) return "0 minutes";
  const minutes = Math.floor(seconds / 60);
  if (minutes <= 0) return "<1 minute";
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

function dateTimeLabel(value: string | null) {
  if (!value) return "Not played yet";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta"
  }).format(new Date(value));
}

function levelBadgeClass(state: "AVAILABLE" | "LOCKED" | "COMPLETED") {
  if (state === "COMPLETED") return "bg-[#d9f4df] text-[#1f5d32]";
  if (state === "AVAILABLE") return "bg-[#dff5f8] text-[#18383f]";
  return "bg-[#e7eaed] text-[#5b6872]";
}

function levelBadgeLabel(state: "AVAILABLE" | "LOCKED" | "COMPLETED") {
  if (state === "COMPLETED") return "Selesai";
  if (state === "AVAILABLE") return "Main";
  return "Terkunci";
}

function SummaryCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <article className="surface p-5">
      <p className="text-sm font-bold uppercase text-[var(--brand)]">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
      <p className="mt-2 text-sm text-[var(--muted)]">{helper}</p>
    </article>
  );
}

function ProgressContent({ progress }: { progress: ParentProgressSummary }) {
  const hasProgress =
    progress.totals.completedLevels > 0 ||
    progress.totals.totalAttempts > 0 ||
    progress.recentSessions.length > 0;

  return (
    <section className="grid gap-6">
      <div>
        <p className="text-sm font-bold uppercase text-[var(--brand)]">Progress</p>
        <h1 className="mt-2 text-3xl font-black">{progress.child.nickname}</h1>
        <p className="mt-3 max-w-3xl text-[var(--muted)]">
          Read-only learning progress from server-authoritative level progress, attempts, sessions,
          and daily play usage.
        </p>
      </div>

      {!hasProgress ? (
        <div className="surface p-5">
          <p className="font-bold">No play history yet.</p>
          <p className="mt-2 text-[var(--muted)]">
            Start the adventure map and complete the first level to populate this summary.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Completed levels"
          value={`${progress.totals.completedLevels}/${progress.totals.totalPublishedLevels}`}
          helper={`${percentLabel(progress.totals.completionPercentage)} of published levels`}
        />
        <SummaryCard
          label="Attempts"
          value={`${progress.totals.correctAttempts}/${progress.totals.totalAttempts}`}
          helper={`${percentLabel(progress.totals.accuracyPercentage)} simple accuracy`}
        />
        <SummaryCard
          label="Today play time"
          value={minutesLabel(progress.todayPlay.activePlaySeconds)}
          helper={`${progress.todayPlay.sessionCount} session${
            progress.todayPlay.sessionCount === 1 ? "" : "s"
          } today`}
        />
        <SummaryCard
          label="Last played"
          value={dateTimeLabel(progress.lastPlayedAt)}
          helper="Based on recent game sessions"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="surface p-5">
          <p className="text-sm font-bold uppercase text-[var(--brand)]">Next level</p>
          {progress.nextAvailableLevel ? (
            <>
              <h2 className="mt-2 text-2xl font-black">{progress.nextAvailableLevel.title}</h2>
              <p className="mt-2 text-[var(--muted)]">
                {progress.nextAvailableLevel.trackTitle} - {progress.nextAvailableLevel.zoneTitle}
              </p>
            </>
          ) : (
            <p className="mt-2 text-[var(--muted)]">
              No available published level is currently unlocked.
            </p>
          )}
        </article>
        <article className="surface p-5">
          <p className="text-sm font-bold uppercase text-[var(--brand)]">Latest completed</p>
          {progress.latestCompletedLevel ? (
            <>
              <h2 className="mt-2 text-2xl font-black">{progress.latestCompletedLevel.title}</h2>
              <p className="mt-2 text-[var(--muted)]">
                {progress.latestCompletedLevel.trackTitle} -{" "}
                {progress.latestCompletedLevel.zoneTitle}
              </p>
              <p className="mt-2 text-sm font-bold text-[var(--muted)]">
                {dateTimeLabel(progress.latestCompletedLevel.completedAt)}
              </p>
            </>
          ) : (
            <p className="mt-2 text-[var(--muted)]">No completed learning level yet.</p>
          )}
        </article>
      </div>

      <section className="surface p-5">
        <div className="mb-4">
          <p className="text-sm font-bold uppercase text-[var(--brand)]">Map summary</p>
          <h2 className="mt-2 text-2xl font-black">Published levels</h2>
        </div>
        <div className="grid gap-4">
          {progress.tracks.map((track) => (
            <section className="rounded-[8px] border border-[#d9ece8] bg-white p-4" key={track.id}>
              <h3 className="font-black">{track.title}</h3>
              <div className="mt-4 grid gap-3">
                {track.zones.map((zone) => (
                  <article className="rounded-[8px] border border-[#e7dfd0] p-4" key={zone.id}>
                    <h4 className="font-black">{zone.title}</h4>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {zone.levels.map((level) => (
                        <div className="rounded-[8px] border border-[#e7dfd0] p-3" key={level.id}>
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-bold">{level.title}</p>
                            <span
                              className={`rounded-[8px] px-2 py-1 text-xs font-black ${levelBadgeClass(
                                level.state
                              )}`}
                            >
                              {levelBadgeLabel(level.state)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
          {progress.tracks.length === 0 ? (
            <p className="text-[var(--muted)]">No published learning levels are available yet.</p>
          ) : null}
        </div>
      </section>

      <section className="surface p-5">
        <div className="mb-4">
          <p className="text-sm font-bold uppercase text-[var(--brand)]">Recent sessions</p>
          <h2 className="mt-2 text-2xl font-black">Play activity</h2>
        </div>
        <div className="grid gap-3">
          {progress.recentSessions.map((session) => (
            <article
              className="rounded-[8px] border border-[#e7dfd0] bg-white p-4"
              key={session.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-black">{session.levelTitle}</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Started {dateTimeLabel(session.startedAt)}
                  </p>
                  {session.endedAt ? (
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Ended {dateTimeLabel(session.endedAt)}
                    </p>
                  ) : null}
                </div>
                <span className="rounded-[8px] bg-[#e7eaed] px-2 py-1 text-xs font-black text-[#5b6872]">
                  {session.status === "ENDED" ? "Ended" : "In progress"}
                </span>
              </div>
            </article>
          ))}
          {progress.recentSessions.length === 0 ? (
            <p className="text-[var(--muted)]">No game sessions have been started yet.</p>
          ) : null}
        </div>
      </section>
    </section>
  );
}

export default async function ParentProgressPage() {
  const user = await requireParentPermission("progress:read-own");
  await requireParentGatePage("/parent/progress");
  const children = await listChildrenByParentId(user.parentProfileId!);
  const child = children[0];
  const progress = child ? await getChildProgressSummary(user.parentProfileId!, child.id) : null;

  return (
    <main className="page-shell py-10">
      {progress ? (
        <ProgressContent progress={progress} />
      ) : (
        <section className="surface p-6">
          <p className="text-sm font-bold uppercase text-[var(--brand)]">Progress</p>
          <h1 className="mt-2 text-3xl font-black">No child profile yet</h1>
          <p className="mt-3 max-w-3xl text-[var(--muted)]">
            Create the first child profile before viewing learning progress.
          </p>
          <Link className="app-button mt-5" href="/parent/children/new">
            Add child profile
          </Link>
        </section>
      )}
    </main>
  );
}
