import Link from "next/link";
import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export default function ParentSecurityPage() {
  return (
    <PlaceholderPage
      title="Security"
      description="Parent PIN, session revocation, and account security foundations. Parent PIN is separate from the account password."
      actions={
        <>
          <Link className="app-button" href="/parent/security/set-parent-pin">
            Set PIN
          </Link>
          <Link className="app-button secondary" href="/parent/security/reset-parent-pin">
            Reset PIN
          </Link>
        </>
      }
    />
  );
}
