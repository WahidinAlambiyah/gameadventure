# Fondasi Game Design

## Ownership aplikasi

Next.js menangani navigation, authentication, parent portal, child selection, adventure map, content loading, progress feedback, settings, dan administration surfaces. Phaser menangani rendering mini-game, touch interaction, animation, audio, dan effects.

Phaser tidak boleh menjadi sumber keputusan correctness, reward, energy, progress, level completion, atau unlock.

## Server-authoritative flow

Client mengirim fakta pilihan:

```json
{
  "questionId": "uuid",
  "selectedOptionId": "uuid",
  "clientSequence": 1
}
```

Server memverifikasi parent ownership, active session, question membership, sequence, dan selected option. Response server menentukan correctness, next question, completion, dan unlock state.

Operational flow saat ini menggunakan child-scoped adventure APIs di `/api/v1/children/:childId/game-sessions`. Generic `/api/v1/game-sessions*` masih placeholder.

## Current boundary

Adventure map, session start/heartbeat/end, attempts, multi-question progression, level completion, dan next-level unlock sudah operational. Rewards dan operational gameplay energy economy belum operational. Content demo tidak dianggap curriculum produksi lengkap.
