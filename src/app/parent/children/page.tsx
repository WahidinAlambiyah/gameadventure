import Link from "next/link";
import { requireParent } from "@/server/auth/session";
import { listChildrenByParentId } from "@/server/repositories/childRepository";

export default async function ParentChildrenPage() {
  const user = await requireParent();
  const children = await listChildrenByParentId(user.parentProfileId!);

  return (
    <main className="page-shell py-10">
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase text-[var(--brand)]">Children</p>
            <h1 className="mt-2 text-3xl font-black">Child profiles</h1>
          </div>
          {children.length === 0 ? (
            <Link className="app-button" href="/parent/children/new">
              Add child profile
            </Link>
          ) : null}
        </div>
        <div className="mt-6 grid gap-4">
          {children.map((child) => (
            <article className="surface p-6" key={child.id}>
              <h2 className="text-2xl font-black">{child.nickname}</h2>
              <p className="mt-2 text-[var(--muted)]">
                {child.ageRange ? `Age range ${child.ageRange}` : "Birth year saved"}
              </p>
            </article>
          ))}
          {children.length === 0 ? (
            <p className="surface p-6 text-[var(--muted)]">
              No child profile has been created yet.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
