import Link from "next/link";
import { requireParent } from "@/server/auth/session";
import { listChildrenByParentId } from "@/server/repositories/childRepository";

export default async function SelectProfilePage() {
  const user = await requireParent();
  const children = await listChildrenByParentId(user.parentProfileId!);

  return (
    <main className="page-shell py-10">
      <section>
        <p className="text-sm font-bold uppercase text-[var(--brand)]">Choose profile</p>
        <h1 className="mt-2 text-3xl font-black">Who is playing?</h1>
        <div className="mt-6 grid gap-4">
          {children.map((child) => (
            <Link className="surface block p-6" href={`/child/${child.id}/map`} key={child.id}>
              <h2 className="text-2xl font-black">{child.nickname}</h2>
              <p className="mt-2 text-[var(--muted)]">Start adventure map</p>
            </Link>
          ))}
          {children.length === 0 ? (
            <Link className="app-button" href="/parent/children/new">
              Add child profile
            </Link>
          ) : null}
        </div>
      </section>
    </main>
  );
}
