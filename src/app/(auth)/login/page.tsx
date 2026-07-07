import Link from "next/link";
import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export default function LoginPage() {
  return (
    <PlaceholderPage
      title="Login"
      description="Email and password login UI placeholder. Better Auth route handlers are mounted under /api/auth."
      actions={
        <>
          <Link className="app-button" href="/parent">
            Continue to parent dashboard
          </Link>
          <Link className="app-button secondary" href="/forgot-password">
            Forgot password
          </Link>
        </>
      }
    />
  );
}
