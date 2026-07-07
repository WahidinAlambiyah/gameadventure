import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export default async function ChildDetailPage({
  params
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = await params;

  return (
    <PlaceholderPage
      title="Child Profile"
      description={`Ownership-protected child profile placeholder for ${childId}. Server queries must scope by child id and parent id.`}
    />
  );
}
