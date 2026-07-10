"use client";

import Link from "next/link";
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
      currentQuestionIndex: number;
      attemptFeedback: AttemptFeedback | null;
    }
  | { status: "completed"; message: string }
  | { status: "rest"; message: string; remainingSeconds: number }
  | { status: "error"; message: string };

type SessionQuestion = {
  id: string;
  prompt: string;
  options: { id: string; label: string }[];
};

type AttemptFeedback = {
  kind: "correct" | "incorrect";
  title: string;
  message: string;
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
  const submissionInFlightRef = useRef(false);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    heartbeatTimerRef.current = undefined;
    sessionIdRef.current = null;
    questionsRef.current = [];
    submissionInFlightRef.current = false;
  }, []);

  const submitAnswer = useCallback(
    async (payload: { questionId: string; selectedOptionId: string }) => {
      const sessionId = sessionIdRef.current;
      if (!sessionId || submissionInFlightRef.current) return;

      submissionInFlightRef.current = true;
      const clientSequence = nextClientSequenceRef.current;
      nextClientSequenceRef.current += 1;

      try {
        const response = await fetch(
          `/api/v1/children/${encodeURIComponent(childId)}/game-sessions/${encodeURIComponent(
            sessionId
          )}/attempts`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              ...payload,
              clientSequence
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

        const answeredQuestionIndex = questionsRef.current.findIndex(
          (question) => question.id === payload.questionId
        );
        const nextQuestionIndex = answeredQuestionIndex + 1;
        if (
          attempt.isCorrect &&
          (answeredQuestionIndex < 0 || nextQuestionIndex >= questionsRef.current.length)
        ) {
          stopHeartbeat();
          setState({
            status: "error",
            message: "Pertanyaan berikutnya tidak tersedia. Kembali ke peta lalu coba lagi."
          });
          return;
        }

        setState((current) => {
          if (current.status !== "playing") return current;

          if (!attempt.isCorrect) {
            return {
              ...current,
              attemptFeedback: {
                kind: "incorrect",
                title: "Belum tepat.",
                message: "Coba pilih balon lain."
              }
            };
          }

          return {
            ...current,
            currentQuestionIndex: nextQuestionIndex,
            attemptFeedback: {
              kind: "correct",
              title: "Benar!",
              message: "Jawabanmu tepat. Teruskan petualangan."
            }
          };
        });
      } catch {
        stopHeartbeat();
        setState({
          status: "error",
          message: "Jawaban tidak dapat dikirim."
        });
      } finally {
        submissionInFlightRef.current = false;
      }
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
          : current
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
      submissionInFlightRef.current = false;
      questionsRef.current = body.data?.session?.questions ?? [];
      setState({
        status: "playing",
        sessionId,
        remainingSeconds: null,
        questions: questionsRef.current,
        currentQuestionIndex: 0,
        attemptFeedback: null
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
        <Link className="app-button mx-auto mt-5 w-full sm:w-auto" href={`/child/${childId}/map`}>
          Kembali ke Adventure Map
        </Link>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="surface p-6">
        <p className="form-error">{state.message}</p>
        <Link className="app-button mt-5 w-full sm:w-auto" href={`/child/${childId}/map`}>
          Kembali ke Adventure Map
        </Link>
      </section>
    );
  }

  if (state.status === "completed") {
    return (
      <section className="surface p-6 text-center">
        <p className="text-sm font-black uppercase text-[var(--brand)]">Level selesai</p>
        <h2 className="mt-2 text-3xl font-black">{state.message}</h2>
        <p className="mx-auto mt-3 max-w-xl text-[var(--muted)]">
          Kembali ke peta untuk melihat level yang sudah selesai dan petualangan berikutnya.
        </p>
        <Link className="app-button mx-auto mt-5 w-full sm:w-auto" href={`/child/${childId}/map`}>
          Kembali ke Adventure Map
        </Link>
      </section>
    );
  }

  if (state.status === "playing" && state.questions.length === 0) {
    return (
      <section className="surface p-6 text-center">
        <p className="text-sm font-black uppercase text-[var(--brand)]">Belum siap dimainkan</p>
        <h2 className="mt-2 text-3xl font-black">Level ini belum punya pertanyaan.</h2>
        <p className="mx-auto mt-3 max-w-xl text-[var(--muted)]">
          Pilih level lain di peta sambil menunggu konten level ini disiapkan.
        </p>
        <Link className="app-button mx-auto mt-5 w-full sm:w-auto" href={`/child/${childId}/map`}>
          Kembali ke Adventure Map
        </Link>
      </section>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="surface grid gap-3 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <p className="text-sm font-black uppercase text-[var(--brand)]">Sesi petualangan</p>
          <h2 className="mt-1 text-2xl font-black">
            {state.status === "loading" ? state.message : "Pilih balon jawaban"}
          </h2>
          {state.status === "playing" ? (
            <div className="mt-1 grid gap-1">
              <p className="font-black text-[var(--brand)]">
                Pertanyaan {state.currentQuestionIndex + 1} dari {state.questions.length}
              </p>
              <p className="text-[var(--muted)]">
                Dengarkan pertanyaan, pilih jawaban, lalu lihat hasilnya.
              </p>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {state.status === "playing" && state.remainingSeconds !== null ? (
            <p className="rounded-[8px] bg-[#eaf8fb] px-3 py-2 text-sm font-black text-[#18383f]">
              Sisa {Math.ceil(state.remainingSeconds / 60)} menit
            </p>
          ) : null}
          <Link className="app-button secondary w-full sm:w-auto" href={`/child/${childId}/map`}>
            Kembali ke Adventure Map
          </Link>
        </div>
      </div>
      {state.status === "playing" ? (
        <>
          {state.attemptFeedback ? (
            <section
              className={`rounded-[8px] border p-4 ${
                state.attemptFeedback.kind === "correct"
                  ? "border-[#91d7a8] bg-[#effbf2] text-[#1f5d32]"
                  : "border-[#f0c36a] bg-[#fff7e6] text-[#76510f]"
              }`}
            >
              <h3 className="text-lg font-black">{state.attemptFeedback.title}</h3>
              <p className="mt-1 text-sm font-bold">{state.attemptFeedback.message}</p>
            </section>
          ) : null}
          <PhaserGame
            question={state.questions[state.currentQuestionIndex]!}
            onAnswer={submitAnswer}
          />
        </>
      ) : null}
    </div>
  );
}
