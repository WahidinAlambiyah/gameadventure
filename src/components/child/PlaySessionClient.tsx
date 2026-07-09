"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PhaserGame } from "@/components/shared/PhaserGame";

type PlaySessionClientProps = {
  childId: string;
  levelId: string;
};

type SessionState =
  | { status: "loading"; message: string }
  | {
      status: "playing";
      sessionId: string;
      remainingSeconds: number | null;
      questions: SessionQuestion[];
      attemptMessage: string | null;
    }
  | { status: "completed"; message: string }
  | { status: "rest"; message: string; remainingSeconds: number }
  | { status: "error"; message: string };

type SessionQuestion = {
  id: string;
  prompt: string;
  options: { id: string; label: string }[];
};

async function parseJson(response: Response) {
  return response.json().catch(() => null) as Promise<{
    success?: boolean;
    data?: {
      session?: { id: string; questions?: SessionQuestion[] };
      heartbeat?: {
        allowed: boolean;
        remainingSeconds: number;
      };
      attempt?: {
        isCorrect: boolean;
        levelCompleted: boolean;
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
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const nextClientSequenceRef = useRef(1);
  const questionsRef = useRef<SessionQuestion[]>([]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    heartbeatTimerRef.current = undefined;
    sessionIdRef.current = null;
    questionsRef.current = [];
  }, []);

  const submitAnswer = useCallback(
    async (payload: { questionId: string; selectedOptionId: string }) => {
      const sessionId = sessionIdRef.current;
      if (!sessionId) return;

      const response = await fetch(
        `/api/v1/children/${encodeURIComponent(childId)}/game-sessions/${encodeURIComponent(
          sessionId
        )}/attempts`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            ...payload,
            clientSequence: nextClientSequenceRef.current++
          })
        }
      );
      const body = await parseJson(response);
      const attempt = body?.data?.attempt;

      if (!response.ok || !attempt) {
        setState({
          status: "error",
          message: body?.error?.message ?? "Jawaban tidak dapat dikirim."
        });
        return;
      }

      if (attempt.levelCompleted) {
        stopHeartbeat();
        setState({
          status: "completed",
          message: "Level selesai. Level berikutnya sudah terbuka."
        });
        return;
      }

      setState((current) =>
        current.status === "playing"
          ? {
              ...current,
              attemptMessage: attempt.isCorrect ? "Benar." : "Coba lagi."
            }
          : current
      );
    },
    [childId, stopHeartbeat]
  );

  useEffect(() => {
    let cancelled = false;

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
        stopHeartbeat();
        setState({
          status: "error",
          message: body?.error?.message ?? "Sesi bermain tidak dapat diperbarui."
        });
        return;
      }

      if (!heartbeatData.allowed) {
        stopHeartbeat();
        setState({
          status: "rest",
          message: "Waktunya Istirahat, Petualang!",
          remainingSeconds: heartbeatData.remainingSeconds
        });
        return;
      }

      setState((current) =>
        current.status === "playing" && current.sessionId === sessionId
          ? {
              ...current,
              remainingSeconds: heartbeatData.remainingSeconds
            }
          : {
              status: "playing",
              sessionId,
              remainingSeconds: heartbeatData.remainingSeconds,
              questions: questionsRef.current,
              attemptMessage: null
            }
      );
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
      nextClientSequenceRef.current = 1;
      questionsRef.current = body.data?.session?.questions ?? [];
      setState({
        status: "playing",
        sessionId,
        remainingSeconds: null,
        questions: questionsRef.current,
        attemptMessage: null
      });
      void heartbeat(sessionId);
      heartbeatTimerRef.current = setInterval(() => {
        if (sessionIdRef.current) void heartbeat(sessionIdRef.current);
      }, 30_000);
    }

    void startSession();

    return () => {
      cancelled = true;
      stopHeartbeat();
    };
  }, [childId, levelId, stopHeartbeat]);

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

  if (state.status === "completed") {
    return (
      <section className="surface p-6 text-center">
        <h2 className="text-3xl font-black">{state.message}</h2>
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
      {state.status === "playing" ? (
        <>
          {state.attemptMessage ? (
            <p className="text-sm font-bold text-[var(--brand-strong)]">{state.attemptMessage}</p>
          ) : null}
          <PhaserGame questions={state.questions} onAnswer={submitAnswer} />
        </>
      ) : null}
    </div>
  );
}
