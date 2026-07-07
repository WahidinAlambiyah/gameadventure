import Link from "next/link";
import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export default function ParentChildrenPage() {
  return (
    <PlaceholderPage
      title="Children"
      description="MVP supports one child profile per parent while the schema keeps the relationship extensible."
      actions={
        <Link className="app-button" href="/parent/children/new">
          Add child profile
        </Link>
      }
    />
  );
}
