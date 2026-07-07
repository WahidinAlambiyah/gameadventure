export type DailyUsageHeartbeat = {
  childId: string;
  parentProfileId: string;
  activeSeconds: number;
};

export interface ScreenTimeService {
  recordHeartbeat(input: DailyUsageHeartbeat): Promise<void>;
  canStartSession(childId: string, parentProfileId: string): Promise<boolean>;
}

export class PlaceholderScreenTimeService implements ScreenTimeService {
  async recordHeartbeat(): Promise<void> {
    throw new Error("Heartbeat persistence is documented but not implemented in the boilerplate.");
  }

  async canStartSession(): Promise<boolean> {
    return true;
  }
}
