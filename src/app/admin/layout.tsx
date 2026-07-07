import { requirePermission } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requirePermission("admin:access");

  return (
    <div className="min-h-screen bg-[#f5f6f7]">
      <header className="bg-[var(--admin)] text-white">
        <div className="page-shell py-5">
          <p className="text-sm font-bold uppercase">Admin Portal</p>
          <h1 className="text-2xl font-black">Operations Console</h1>
        </div>
      </header>
      {children}
    </div>
  );
}
