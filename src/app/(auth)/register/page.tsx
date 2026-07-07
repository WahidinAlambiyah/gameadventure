import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/features/authentication/AuthForms";
import { getCurrentUser } from "@/server/auth/session";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user?.parentProfileId) redirect("/parent");

  return (
    <main className="page-shell py-10">
      <section className="auth-panel">
        <div>
          <p className="text-sm font-bold uppercase text-[var(--brand)]">Parent account</p>
          <h1 className="mt-2 text-3xl font-black">Create account</h1>
          <p className="mt-3 text-[var(--muted)]">
            Register a parent account, then create the first child profile for the MVP.
          </p>
        </div>
        <RegisterForm />
        <p className="text-sm text-[var(--muted)]">
          Already registered?{" "}
          <Link className="font-bold text-[var(--brand-strong)]" href="/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
