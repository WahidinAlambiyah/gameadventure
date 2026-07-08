import { VerifyPinForm } from "@/features/parent/securityForms";
import { requireParent } from "@/server/auth/session";
import { getParentSecurityStatus } from "@/server/parent-gate/pinService";

export default async function VerifyParentPinPage() {
  const user = await requireParent();
  const status = await getParentSecurityStatus(user.parentProfileId!);

  return (
    <main className="page-shell py-10">
      <section className="auth-panel">
        <div>
          <p className="text-sm font-bold uppercase text-[var(--brand)]">Parent gate</p>
          <h1 className="mt-2 text-3xl font-black">Unlock Parent Portal</h1>
          <p className="mt-3 text-[var(--muted)]">Enter the four-digit parent PIN to continue.</p>
          {status.locked ? (
            <p className="form-error mt-4" role="alert">
              Parent PIN is temporarily locked. Try again after the lockout period.
            </p>
          ) : null}
        </div>
        <VerifyPinForm />
      </section>
    </main>
  );
}
