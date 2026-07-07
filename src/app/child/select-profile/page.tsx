import Link from "next/link";
import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export default function SelectProfilePage() {
  return (
    <PlaceholderPage
      title="Choose Profile"
      description="Child profiles are not authentication users. Selection must stay scoped to the authenticated parent session."
      actions={
        <Link className="app-button" href="/child/demo-child/map">
          Demo child map
        </Link>
      }
    />
  );
}
