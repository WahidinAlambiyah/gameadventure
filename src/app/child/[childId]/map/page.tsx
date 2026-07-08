import Link from "next/link";
import { requireParentPermission } from "@/server/auth/session";
import { getAdventureMapForChild } from "@/server/services/adventurePlay";

export default async function ChildMapPage({ params }: { params: Promise<{ childId: string }> }) {
  const user = await requireParentPermission("child:read-own");
  const { childId } = await params;
  const tracks = await getAdventureMapForChild(user.parentProfileId!, childId);

  return (
    <main className="page-shell py-8">
      <div className="mb-6">
        <p className="text-sm font-bold uppercase text-[var(--brand)]">Adventure Map</p>
        <h1 className="mt-2 text-3xl font-black">Pilih Petualangan</h1>
      </div>
      <div className="grid gap-6">
        {tracks.map((track) => (
          <section className="surface p-5" key={track.id}>
            <div className="mb-5">
              <h2 className="text-2xl font-black">{track.title}</h2>
              {track.description ? (
                <p className="mt-2 text-[var(--muted)]">{track.description}</p>
              ) : null}
            </div>
            <div className="grid gap-4">
              {track.zones.map((zone) => (
                <article
                  className="rounded-[8px] border border-[#d9ece8] bg-white p-4"
                  key={zone.id}
                >
                  <h3 className="font-black">{zone.title}</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {zone.levels.map((level) => {
                      const label =
                        level.state === "COMPLETED"
                          ? "Selesai"
                          : level.state === "AVAILABLE"
                            ? "Main"
                            : "Terkunci";
                      return (
                        <div className="surface p-4" key={level.id}>
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="font-black">{level.title}</h4>
                            <span className="rounded-[8px] bg-[#eaf8fb] px-2 py-1 text-xs font-black text-[#18383f]">
                              {level.state}
                            </span>
                          </div>
                          <div className="mt-4">
                            {level.state === "LOCKED" ? (
                              <button
                                className="app-button secondary w-full"
                                disabled
                                type="button"
                              >
                                {label}
                              </button>
                            ) : (
                              <Link
                                className="app-button w-full"
                                href={`/child/${childId}/play/${level.id}`}
                              >
                                {label}
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
        {tracks.length === 0 ? (
          <section className="surface p-6">
            <p className="text-[var(--muted)]">Belum ada petualangan yang diterbitkan.</p>
          </section>
        ) : null}
      </div>
    </main>
  );
}
