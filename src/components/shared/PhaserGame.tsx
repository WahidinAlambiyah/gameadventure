"use client";

import { useEffect, useRef } from "react";

export type PhaserQuestion = {
  id: string;
  prompt: string;
  options: { id: string; label: string }[];
};

export type PhaserAnswerPayload = {
  questionId: string;
  selectedOptionId: string;
};

export type PhaserAttemptConfig = {
  questions: PhaserQuestion[];
  onAnswer: (payload: PhaserAnswerPayload) => void;
};

export function PhaserGame({
  questions,
  onAnswer
}: {
  questions: PhaserQuestion[];
  onAnswer: (payload: PhaserAnswerPayload) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let game: import("phaser").Game | undefined;
    let cancelled = false;

    async function boot() {
      if (!hostRef.current) return;

      const Phaser = await import("phaser");
      const { BootScene } = await import("@/game/scenes/BootScene");
      const { PreloadScene } = await import("@/game/scenes/PreloadScene");
      const { InstructionScene } = await import("@/game/scenes/InstructionScene");
      const { GameplayScene } = await import("@/game/scenes/GameplayScene");
      const { ResultScene } = await import("@/game/scenes/ResultScene");
      const { PauseScene } = await import("@/game/scenes/PauseScene");
      const { BalloonShooterScene } = await import("@/game/minigames/BalloonShooterScene");

      if (cancelled || !hostRef.current) return;

      game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: hostRef.current,
        backgroundColor: "#fffaf1",
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: 800,
          height: 480
        },
        input: {
          activePointers: 3
        },
        scene: [
          BootScene,
          PreloadScene,
          InstructionScene,
          GameplayScene,
          ResultScene,
          PauseScene,
          BalloonShooterScene
        ]
      });
      game.registry.set("attemptConfig", { questions, onAnswer } satisfies PhaserAttemptConfig);
    }

    boot().catch(() => undefined);

    return () => {
      cancelled = true;
      game?.destroy(true);
    };
  }, [onAnswer, questions]);

  return (
    <div
      ref={hostRef}
      aria-label="BacaNgaji Adventure gameplay demo"
      className="min-h-[320px] overflow-hidden rounded-[20px] border-4 border-[#78c6d0] bg-white"
    />
  );
}
