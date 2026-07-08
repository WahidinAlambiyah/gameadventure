import { requireParent } from "@/server/auth/session";
import { requireParentGatePage } from "@/server/parent-gate/guard";
import { getParentSettingsSummary } from "@/server/parent/settings";
import { SettingsForm } from "@/features/parent/SettingsForm";

export default async function ParentSettingsPage() {
  const user = await requireParent();
  await requireParentGatePage("/parent/settings");
  const settings = await getParentSettingsSummary(user.parentProfileId!);

  return (
    <main className="page-shell py-10">
      <section className="auth-panel">
        <div>
          <p className="text-sm font-bold uppercase text-[var(--brand)]">Settings</p>
          <h1 className="mt-2 text-3xl font-black">Parental settings</h1>
          <p className="mt-3 text-[var(--muted)]">
            Daily play limits are enforced by server policy. Active-play accumulation is deferred.
          </p>
        </div>
        <div className="surface p-6">
          <p>Used today: {Math.floor(settings.usage.usedSeconds / 60)} minutes</p>
          <p>Remaining: {Math.floor(settings.usage.remainingSeconds / 60)} minutes</p>
          <p>Next reset: {settings.usage.resetAt.toISOString()}</p>
          <p>Override active: {settings.parentOverrideActive ? "Yes" : "No"}</p>
        </div>
        <SettingsForm
          dailyLimitMinutes={settings.dailyLimitMinutes}
          timezone={settings.timezone}
          energyEnabled={settings.energyEnabled}
        />
      </section>
    </main>
  );
}
