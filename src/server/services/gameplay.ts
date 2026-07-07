export type AttemptInput = {
  gameSessionId: string;
  questionId: string;
  selectedAnswerId: string;
  clientSequence: number;
};

export type AttemptResult = {
  correct: boolean;
  serverSequence: number;
  rewardDelta: number;
  energyDelta: number;
};

export interface GameplayService {
  recordAttempt(input: AttemptInput): Promise<AttemptResult>;
  completeLevel(gameSessionId: string, idempotencyKey: string): Promise<void>;
}

export class PlaceholderGameplayService implements GameplayService {
  async recordAttempt(): Promise<AttemptResult> {
    throw new Error("Gameplay scoring is server-authoritative and not implemented yet.");
  }

  async completeLevel(): Promise<void> {
    throw new Error("Level completion requires idempotent server-side reward processing.");
  }
}
