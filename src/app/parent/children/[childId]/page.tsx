import { notFound } from "next/navigation";
import { ChildProfileManager } from "@/features/parent/ChildProfileManager";
import { requireParentGatePage } from "@/server/parent-gate/guard";
import { findChildByIdAndParentId } from "@/server/repositories/childRepository";

export default async function ChildDetailPage({
  params
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = await params;
  const { user } = await requireParentGatePage(`/parent/children/${childId}`);
  const child = await findChildByIdAndParentId(childId, user.parentProfileId!);
  if (!child) notFound();

  return (
    <main className="page-shell py-10">
      <section className="mx-auto grid max-w-2xl gap-6">
        <div>
          <p className="text-sm font-bold uppercase text-[var(--brand)]">Child profile</p>
          <h1 className="mt-2 text-3xl font-black">Manage {child.nickname}</h1>
          <p className="mt-3 text-[var(--muted)]">
            Update only the profile details needed for the learning experience.
          </p>
        </div>
        <ChildProfileManager child={child} />
      </section>
    </main>
  );
}
