import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page-shell py-10">
      <section className="grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
        <div className="space-y-6">
          <p className="text-sm font-bold uppercase tracking-wide text-[var(--brand-strong)]">
            Boilerplate foundation
          </p>
          <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">
            BacaNgaji Adventure
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-[var(--muted)]">
            A modular learning platform foundation for SastraNusantara and HijaiyahIsland, prepared
            for secure parent accounts, child profiles, server-authoritative progress, and Phaser
            mini-games.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link className="app-button" href="/register">
              Start setup
            </Link>
            <Link className="app-button secondary" href="/child/select-profile">
              Child mode
            </Link>
          </div>
        </div>
        <div className="surface p-6">
          <div className="aspect-square rounded-[24px] bg-[#dff5ef] p-6">
            <div className="grid h-full place-items-center rounded-[20px] border-4 border-dashed border-[#78c6d0] text-center">
              <div>
                <p className="text-5xl font-black text-[var(--brand)]">A</p>
                <p className="mt-2 font-bold">Placeholder learning island</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
