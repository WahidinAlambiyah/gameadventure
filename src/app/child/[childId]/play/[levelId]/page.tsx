import { PhaserGame } from "@/components/shared/PhaserGame";

export default async function PlayLevelPage({
  params
}: {
  params: Promise<{ childId: string; levelId: string }>;
}) {
  const { childId, levelId } = await params;

  return (
    <main className="page-shell py-6">
      <div className="mb-4">
        <p className="text-sm font-bold uppercase text-[var(--brand)]">Demo level</p>
        <h1 className="text-3xl font-black">{levelId}</h1>
        <p className="muted">Child: {childId}</p>
      </div>
      <PhaserGame />
    </main>
  );
}
