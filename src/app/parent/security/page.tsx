import Link from "next/link";
import { requireParent } from "@/server/auth/session";
import { requireParentGatePage } from "@/server/parent-gate/guard";
import { getParentSecurityStatus } from "@/server/parent-gate/pinService";
import { LockParentPortalButton } from "@/features/parent/securityForms";

export default async function ParentSecurityPage() {
  const user = await requireParent();
  await requireParentGatePage("/parent/security");
  const status = await getParentSecurityStatus(user.parentProfileId!);

  return (
    <main className="page-shell py-10">
      <section className="auth-panel">
        <div>
          <p className="text-sm font-bold uppercase text-[var(--brand)]">Security</p>
          <h1 className="mt-2 text-3xl font-black">Parent PIN</h1>
          <p className="mt-3 text-[var(--muted)]">
            Parent PIN is a secondary gate for parent controls. It is separate from the account
            password.
          </p>
        </div>
        <div className="surface p-6">
          <p>PIN configured: {status.pinConfigured ? "Yes" : "No"}</p>
          <p>Locked: {status.locked ? "Yes" : "No"}</p>
          {status.lockedUntil ? <p>Locked until: {status.lockedUntil.toISOString()}</p> : null}
          {status.lastPinVerifiedAt ? (
            <p>Last verified: {status.lastPinVerifiedAt.toISOString()}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link className="app-button" href="/parent/security/set-parent-pin">
            Change PIN
          </Link>
          <LockParentPortalButton />
          <Link className="app-button secondary" href="/parent/security/reset-parent-pin">
            Reset PIN
          </Link>
        </div>
      </section>
    </main>
  );
}
