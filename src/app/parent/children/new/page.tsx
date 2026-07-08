import { redirect } from "next/navigation";
import { ChildProfileForm } from "@/features/parent/ChildProfileForm";
import { requireParent } from "@/server/auth/session";
import { requireParentGatePage } from "@/server/parent-gate/guard";
import { listChildrenByParentId } from "@/server/repositories/childRepository";

export default async function NewChildPage() {
  const user = await requireParent();
  await requireParentGatePage("/parent/children/new");
  const children = await listChildrenByParentId(user.parentProfileId!);
  if (children.length > 0) redirect("/parent/children");

  return (
    <main className="page-shell py-10">
      <section className="auth-panel">
        <div>
          <p className="text-sm font-bold uppercase text-[var(--brand)]">Child profile</p>
          <h1 className="mt-2 text-3xl font-black">Create profile</h1>
          <p className="mt-3 text-[var(--muted)]">
            Save only the data needed to personalize the first adventure session.
          </p>
        </div>
        <ChildProfileForm />
      </section>
    </main>
  );
}
