"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function LogoutButton() {
  const router = useRouter();

  async function onClick() {
    await fetch("/api/v1/auth/parent-gate", { method: "DELETE" }).catch(() => null);
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button className="app-button secondary" onClick={onClick} type="button">
      Logout
    </button>
  );
}
