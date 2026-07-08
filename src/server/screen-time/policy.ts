export type ScreenTimeReason = "AVAILABLE" | "DAILY_LIMIT_REACHED" | "PARENT_OVERRIDE";

type ScreenTimeInput = {
  dailyLimitSeconds: number;
  activePlaySeconds: number;
  timezone: string;
  now: Date;
  parentOverrideUntil?: Date | null;
};

export type ScreenTimePolicy = ReturnType<typeof evaluateScreenTimePolicy>;

function datePartsInTimezone(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "01";
  return {
    year: Number(value("year")),
    month: Number(value("month")),
    day: Number(value("day")),
    usageDate: `${value("year")}-${value("month")}-${value("day")}`
  };
}

function timezoneOffsetMs(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "0";
  const asUtc = Date.UTC(
    Number(value("year")),
    Number(value("month")) - 1,
    Number(value("day")),
    Number(value("hour")),
    Number(value("minute")),
    Number(value("second"))
  );
  return asUtc - date.getTime();
}

function localDateTimeToUtc(
  timezone: string,
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0
) {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const firstPass = new Date(guess.getTime() - timezoneOffsetMs(guess, timezone));
  return new Date(guess.getTime() - timezoneOffsetMs(firstPass, timezone));
}

export function usageDateForTimezone(date: Date, timezone: string) {
  return datePartsInTimezone(date, timezone).usageDate;
}

export function nextResetAt(date: Date, timezone: string) {
  const parts = datePartsInTimezone(date, timezone);
  return localDateTimeToUtc(timezone, parts.year, parts.month, parts.day + 1);
}

export function evaluateScreenTimePolicy(input: ScreenTimeInput) {
  const overrideActive = Boolean(
    input.parentOverrideUntil && input.parentOverrideUntil.getTime() > input.now.getTime()
  );
  const remainingSeconds = Math.max(0, input.dailyLimitSeconds - input.activePlaySeconds);
  const allowed = overrideActive || remainingSeconds > 0;
  const reason: ScreenTimeReason = overrideActive
    ? "PARENT_OVERRIDE"
    : allowed
      ? "AVAILABLE"
      : "DAILY_LIMIT_REACHED";

  return {
    allowed,
    usedSeconds: input.activePlaySeconds,
    remainingSeconds,
    limitSeconds: input.dailyLimitSeconds,
    usageDate: usageDateForTimezone(input.now, input.timezone),
    resetAt: nextResetAt(input.now, input.timezone),
    overrideActive,
    reason
  };
}

export function canChildPlayNow(policy: ScreenTimePolicy) {
  return policy.allowed;
}
