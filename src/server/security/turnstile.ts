export interface TurnstileVerifier {
  verify(token: string, ip?: string): Promise<boolean>;
}

export class DisabledTurnstileVerifier implements TurnstileVerifier {
  async verify(): Promise<boolean> {
    return true;
  }
}
