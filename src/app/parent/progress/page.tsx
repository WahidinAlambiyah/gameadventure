import { PlaceholderPage } from "@/components/shared/PlaceholderPage";
import { requireParentGatePage } from "@/server/parent-gate/guard";

export default async function ParentProgressPage() {
  await requireParentGatePage("/parent/progress");
  return (
    <PlaceholderPage
      title="Progress"
      description="Progress dashboard placeholder backed by server-authoritative attempts, level progress, track progress, and ledgers."
    />
  );
}
