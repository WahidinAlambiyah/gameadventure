import Link from "next/link";

export function ChildNavigation({ childId = "demo-child" }: { childId?: string }) {
  return (
    <nav className="flex flex-wrap gap-3">
      <Link className="app-button" href={`/child/${childId}/map`}>
        Map
      </Link>
      <Link className="app-button secondary" href="/child/select-profile">
        Profiles
      </Link>
      <Link className="app-button secondary" href="/parent/security/verify-parent-pin">
        Parent gate
      </Link>
    </nav>
  );
}
