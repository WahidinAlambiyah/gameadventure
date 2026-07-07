import { ChildNavigation } from "@/components/child/ChildNavigation";
import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export default async function ChildHomePage({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;

  return (
    <PlaceholderPage
      title="Child Adventure"
      description="Child-mode shell with large controls and reduced text dependency."
      actions={<ChildNavigation childId={childId} />}
    />
  );
}
