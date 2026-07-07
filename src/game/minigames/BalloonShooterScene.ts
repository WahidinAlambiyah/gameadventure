import Phaser from "phaser";

export class BalloonShooterScene extends Phaser.Scene {
  private score = 0;

  constructor() {
    super("BalloonShooterScene");
  }

  create() {
    const { width, height } = this.scale;
    const scoreText = this.add.text(24, 24, "Score 0", {
      fontFamily: "Arial",
      fontSize: "24px",
      color: "#21313c"
    });

    const balloon = this.add.circle(width / 2, height / 2, 58, 0xf2c14e).setInteractive({
      useHandCursor: true
    });

    this.add
      .text(width / 2, height / 2, "ba", {
        fontFamily: "Arial",
        fontSize: "38px",
        color: "#21313c"
      })
      .setOrigin(0.5);

    balloon.on("pointerdown", () => {
      this.score += 1;
      scoreText.setText(`Score ${this.score}`);
      this.tweens.add({
        targets: balloon,
        scale: 1.18,
        yoyo: true,
        duration: 120
      });
    });
  }
}
