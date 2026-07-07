import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";

const links = [
  ["/parent", "Dashboard"],
  ["/parent/children", "Children"],
  ["/parent/progress", "Progress"],
  ["/parent/settings", "Settings"],
  ["/parent/security", "Security"]
] as const;

export function ParentNavigation() {
  return (
    <nav className="flex flex-wrap gap-2">
      {links.map(([href, label]) => (
        <Link className="app-button secondary" href={href} key={href}>
          {label}
        </Link>
      ))}
      <LogoutButton />
    </nav>
  );
}
