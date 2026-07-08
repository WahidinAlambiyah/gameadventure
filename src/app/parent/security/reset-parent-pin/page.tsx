import { PlaceholderPage } from "@/components/shared/PlaceholderPage";
import { requireParent } from "@/server/auth/session";

export default async function ResetParentPinPage() {
  await requireParent();

  return (
    <PlaceholderPage
      title="Reset Parent PIN"
      description="Password-based PIN reset is deferred until a reviewed Better Auth reauthentication API is selected."
    />
  );
}
