import Phaser from "phaser";

export class InstructionScene extends Phaser.Scene {
  constructor() {
    super("InstructionScene");
  }

  create() {
    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2 - 30, "Tap the bright balloon", {
        fontFamily: "Arial",
        fontSize: "32px",
        color: "#21313c"
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height / 2 + 30, "Mouse and touch both work", {
        fontFamily: "Arial",
        fontSize: "20px",
        color: "#5b6872"
      })
      .setOrigin(0.5);
    this.input.once("pointerdown", () => this.scene.start("BalloonShooterScene"));
  }
}
