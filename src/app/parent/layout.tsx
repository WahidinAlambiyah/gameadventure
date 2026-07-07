import { ParentNavigation } from "@/components/parent/ParentNavigation";
import { requireAuthentication } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function ParentLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireAuthentication();

  return (
    <div className="min-h-screen bg-[#fffaf1]">
      <header className="border-b border-[#e7dfd0] bg-white">
        <div className="page-shell flex flex-col gap-4 py-5">
          <div>
            <p className="text-sm font-bold uppercase text-[var(--brand)]">Parent Portal</p>
            <h1 className="text-2xl font-black">BacaNgaji Adventure</h1>
          </div>
          <ParentNavigation />
        </div>
      </header>
      {children}
    </div>
  );
}
