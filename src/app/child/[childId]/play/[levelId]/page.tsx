import Link from "next/link";
import { PlaySessionClient } from "@/components/child/PlaySessionClient";
import { requireParentPermission } from "@/server/auth/session";
import { getAdventureMapForChild } from "@/server/services/adventurePlay";

export default async function PlayLevelPage({
  params
}: {
  params: Promise<{ childId: string; levelId: string }>;
}) {
  const user = await requireParentPermission("child:read-own");
  const { childId, levelId } = await params;
  const tracks = await getAdventureMapForChild(user.parentProfileId!, childId);
  const selectedLevel = tracks
    .flatMap((track) => track.zones)
    .flatMap((zone) => zone.levels)
    .find((level) => level.id === levelId);

  return (
    <main className="page-shell py-6">
      <div className="mb-4">
        <Link
          className="text-sm font-bold text-[var(--brand-strong)]"
          href={`/child/${childId}/map`}
        >
          Kembali ke peta
        </Link>
        <p className="mt-4 text-sm font-bold uppercase text-[var(--brand)]">Demo level</p>
        <h1 className="text-3xl font-black">{selectedLevel?.title ?? "Level"}</h1>
      </div>
      {selectedLevel && selectedLevel.state !== "LOCKED" ? (
        <PlaySessionClient childId={childId} levelId={levelId} />
      ) : (
        <section className="surface p-6">
          <p className="form-error">Level ini belum terbuka.</p>
        </section>
      )}
    </main>
  );
}
