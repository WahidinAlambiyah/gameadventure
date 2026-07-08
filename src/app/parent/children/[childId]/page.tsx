import { PlaceholderPage } from "@/components/shared/PlaceholderPage";
import { requireParentGatePage } from "@/server/parent-gate/guard";

export default async function ChildDetailPage({
  params
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = await params;
  await requireParentGatePage(`/parent/children/${childId}`);

  return (
    <PlaceholderPage
      title="Child Profile"
      description={`Ownership-protected child profile placeholder for ${childId}. Server queries must scope by child id and parent id.`}
    />
  );
}
