import { z } from "zod";
import { fail, ok } from "@/server/errors/api";
import { requireParentPermission } from "@/server/auth/session";
import { requireParentGate } from "@/server/parent-gate/guard";
import {
  allowedTimezones,
  getParentSettingsSummary,
  updateParentSettings
} from "@/server/parent/settings";
import { ValidationError } from "@/server/errors/errors";

const settingsPatchSchema = z
  .object({
    dailyLimitMinutes: z
      .number()
      .int()
      .min(10)
      .max(120)
      .refine((value) => value % 5 === 0),
    timezone: z.enum(allowedTimezones),
    energyEnabled: z.boolean()
  })
  .strict();

export async function GET(request: Request) {
  try {
    const user = await requireParentPermission("parent-setting:read-own", request.headers);
    await requireParentGate(request.headers);
    return ok(await getParentSettingsSummary(user.parentProfileId!));
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireParentPermission("parent-setting:update-own", request.headers);
    await requireParentGate(request.headers);
    const body = await request.json().catch(() => null);
    const parsed = settingsPatchSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError("Parental settings payload is invalid.");
    await updateParentSettings(user.id, user.parentProfileId!, parsed.data);
    return ok(await getParentSettingsSummary(user.parentProfileId!));
  } catch (error) {
    return fail(error);
  }
}
