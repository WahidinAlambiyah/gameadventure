import Phaser from "phaser";

type AttemptConfig = {
  question?: {
    id: string;
    prompt: string;
    options: { id: string; label: string }[];
  };
  onAnswer?: (payload: { questionId: string; selectedOptionId: string }) => void;
};

export class BalloonShooterScene extends Phaser.Scene {
  constructor() {
    super("BalloonShooterScene");
  }

  create() {
    const { width, height } = this.scale;
    const config = this.registry.get("attemptConfig") as AttemptConfig | undefined;
    const question = config?.question;

    this.add.text(24, 24, question?.prompt ?? "Pilih balon jawaban", {
      fontFamily: "Arial",
      fontSize: "24px",
      color: "#21313c"
    });

    if (!question || question.options.length === 0) {
      this.add
        .text(width / 2, height / 2, "Level ini belum punya pertanyaan.", {
          fontFamily: "Arial",
          fontSize: "28px",
          color: "#5b6872"
        })
        .setOrigin(0.5);
      return;
    }

    const startX = width / 2 - ((question.options.length - 1) * 150) / 2;
    question.options.forEach((option, index) => {
      const x = startX + index * 150;
      const balloon = this.add.circle(x, height / 2, 58, 0xf2c14e).setInteractive({
        useHandCursor: true
      });

      this.add
        .text(x, height / 2, option.label, {
          fontFamily: "Arial",
          fontSize: "38px",
          color: "#21313c"
        })
        .setOrigin(0.5);

      balloon.on("pointerdown", () => {
        config?.onAnswer?.({
          questionId: question.id,
          selectedOptionId: option.id
        });
        this.tweens.add({
          targets: balloon,
          scale: 1.18,
          yoyo: true,
          duration: 120
        });
      });
    });
  }
}
