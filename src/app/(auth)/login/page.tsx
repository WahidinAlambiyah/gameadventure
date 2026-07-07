import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/authentication/AuthForms";
import { getCurrentUser } from "@/server/auth/session";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user?.parentProfileId) redirect("/parent");

  return (
    <main className="page-shell py-10">
      <section className="auth-panel">
        <div>
          <p className="text-sm font-bold uppercase text-[var(--brand)]">Parent account</p>
          <h1 className="mt-2 text-3xl font-black">Sign in</h1>
          <p className="mt-3 text-[var(--muted)]">
            Continue to the parent dashboard and child profile selection.
          </p>
        </div>
        <LoginForm />
        <p className="text-sm text-[var(--muted)]">
          Need a parent account?{" "}
          <Link className="font-bold text-[var(--brand-strong)]" href="/register">
            Register
          </Link>
        </p>
      </section>
    </main>
  );
}
