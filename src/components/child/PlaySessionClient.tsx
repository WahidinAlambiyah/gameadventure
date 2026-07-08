"use client";

import { useEffect, useRef, useState } from "react";
import { PhaserGame } from "@/components/shared/PhaserGame";

type PlaySessionClientProps = {
  childId: string;
  levelId: string;
};

type SessionState =
  | { status: "loading"; message: string }
  | { status: "playing"; sessionId: string; remainingSeconds: number | null }
  | { status: "rest"; message: string; remainingSeconds: number }
  | { status: "error"; message: string };

async function parseJson(response: Response) {
  return response.json().catch(() => null) as Promise<{
    success?: boolean;
    data?: {
      session?: { id: string };
      heartbeat?: {
        allowed: boolean;
        remainingSeconds: number;
      };
    };
    error?: { message?: string };
  } | null>;
}

export function PlaySessionClient({ childId, levelId }: PlaySessionClientProps) {
  const [state, setState] = useState<SessionState>({
    status: "loading",
    message: "Menyiapkan petualangan..."
  });
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let heartbeatTimer: ReturnType<typeof setInterval> | undefined;

    async function heartbeat(sessionId: string) {
      const response = await fetch(
        `/api/v1/children/${encodeURIComponent(childId)}/game-sessions/${encodeURIComponent(
          sessionId
        )}/heartbeat`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{}"
        }
      );
      const body = await parseJson(response);
      const heartbeatData = body?.data?.heartbeat;

      if (cancelled) return;

      if (!response.ok || !heartbeatData) {
        setState({
          status: "error",
          message: body?.error?.message ?? "Sesi bermain tidak dapat diperbarui."
        });
        return;
      }

      if (!heartbeatData.allowed) {
        setState({
          status: "rest",
          message: "Waktunya Istirahat, Petualang!",
          remainingSeconds: heartbeatData.remainingSeconds
        });
        return;
      }

      setState({
        status: "playing",
        sessionId,
        remainingSeconds: heartbeatData.remainingSeconds
      });
    }

    async function startSession() {
      const response = await fetch(
        `/api/v1/children/${encodeURIComponent(childId)}/game-sessions`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ levelId })
        }
      );
      const body = await parseJson(response);
      const sessionId = body?.data?.session?.id;

      if (cancelled) return;

      if (!response.ok || !sessionId) {
        setState({
          status: "error",
          message: body?.error?.message ?? "Sesi bermain tidak dapat dimulai."
        });
        return;
      }

      sessionIdRef.current = sessionId;
      setState({ status: "playing", sessionId, remainingSeconds: null });
      void heartbeat(sessionId);
      heartbeatTimer = setInterval(() => {
        if (sessionIdRef.current) void heartbeat(sessionIdRef.current);
      }, 30_000);
    }

    void startSession();

    return () => {
      cancelled = true;
      if (heartbeatTimer) clearInterval(heartbeatTimer);
    };
  }, [childId, levelId]);

  if (state.status === "rest") {
    return (
      <section className="surface p-6 text-center">
        <h2 className="text-3xl font-black">{state.message}</h2>
        <p className="mt-3 text-[var(--muted)]">Lanjutkan lagi setelah waktu bermain direset.</p>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="surface p-6">
        <p className="form-error">{state.message}</p>
      </section>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="surface flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="font-bold">
          {state.status === "loading" ? state.message : "Sesi petualangan aktif"}
        </p>
        {state.status === "playing" && state.remainingSeconds !== null ? (
          <p className="text-sm font-bold text-[var(--brand-strong)]">
            Sisa {Math.ceil(state.remainingSeconds / 60)} menit
          </p>
        ) : null}
      </div>
      <PhaserGame />
    </div>
  );
}
