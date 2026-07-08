import Link from "next/link";
import { requireParent } from "@/server/auth/session";
import { requireParentGatePage } from "@/server/parent-gate/guard";
import { listChildrenByParentId } from "@/server/repositories/childRepository";

export default async function ParentDashboardPage() {
  const user = await requireParent();
  await requireParentGatePage("/parent");
  const children = await listChildrenByParentId(user.parentProfileId!);
  const child = children[0];

  return (
    <main className="page-shell py-10">
      <section className="dashboard-grid">
        <div>
          <p className="text-sm font-bold uppercase text-[var(--brand)]">Dashboard</p>
          <h1 className="mt-2 text-3xl font-black">Parent home</h1>
          <p className="mt-3 max-w-2xl text-[var(--muted)]">
            Manage the active child profile and start the child-facing adventure flow.
          </p>
        </div>

        {child ? (
          <article className="surface p-6">
            <p className="text-sm font-bold uppercase text-[var(--brand)]">Active child</p>
            <h2 className="mt-2 text-2xl font-black">{child.nickname}</h2>
            <p className="mt-2 text-[var(--muted)]">
              {child.ageRange ? `Age range ${child.ageRange}` : "Birth year saved"}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link className="app-button" href="/child/select-profile">
                Choose profile
              </Link>
              <Link className="app-button secondary" href="/parent/children">
                View details
              </Link>
            </div>
          </article>
        ) : (
          <article className="surface p-6">
            <p className="text-sm font-bold uppercase text-[var(--brand)]">Setup</p>
            <h2 className="mt-2 text-2xl font-black">Create the first child profile</h2>
            <p className="mt-2 text-[var(--muted)]">
              The MVP allows one active child profile per parent account.
            </p>
            <Link className="app-button mt-5" href="/parent/children/new">
              Add child profile
            </Link>
          </article>
        )}
      </section>
    </main>
  );
}
