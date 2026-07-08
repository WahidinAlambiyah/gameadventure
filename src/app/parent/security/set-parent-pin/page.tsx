import { requireParent } from "@/server/auth/session";
import { getParentSecurityStatus } from "@/server/parent-gate/pinService";
import { SetPinForm } from "@/features/parent/securityForms";

export default async function SetParentPinPage() {
  const user = await requireParent();
  const status = await getParentSecurityStatus(user.parentProfileId!);

  return (
    <main className="page-shell py-10">
      <section className="auth-panel">
        <div>
          <p className="text-sm font-bold uppercase text-[var(--brand)]">Parent PIN</p>
          <h1 className="mt-2 text-3xl font-black">
            {status.pinConfigured ? "Change PIN" : "Set PIN"}
          </h1>
          <p className="mt-3 text-[var(--muted)]">
            Use exactly four digits. The PIN is never stored in plaintext.
          </p>
        </div>
        <SetPinForm mode={status.pinConfigured ? "change" : "set"} />
      </section>
    </main>
  );
}
