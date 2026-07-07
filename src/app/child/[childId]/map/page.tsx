import Link from "next/link";
import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export default async function ChildMapPage({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;

  return (
    <PlaceholderPage
      title="Adventure Map"
      description="Map placeholder for SastraNusantara and HijaiyahIsland tracks. Unlock decisions belong on the server."
      actions={
        <Link className="app-button" href={`/child/${childId}/play/demo-level`}>
          Play demo level
        </Link>
      }
    />
  );
}
