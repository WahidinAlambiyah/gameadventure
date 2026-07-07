export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds?: number;
};

export interface RateLimiter {
  check(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult>;
}

export class NoopRateLimiter implements RateLimiter {
  async check(): Promise<RateLimitResult> {
    return { allowed: true };
  }
}
