# Game Design Foundation

Next.js owns navigation, authentication, parent portal, child profile selection, settings, admin CMS, and progress views.

Phaser owns mini-game rendering, touch interaction, animation, audio interaction, and game-specific effects.

The browser must only submit facts:

```json
{
  "gameSessionId": "uuid",
  "questionId": "uuid",
  "selectedAnswerId": "uuid",
  "clientSequence": 1
}
```

The server calculates correctness, rewards, energy, progress, level completion, and unlocks. Completion and reward processing must use idempotency keys.
