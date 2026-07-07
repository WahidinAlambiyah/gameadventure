import { z } from "zod";
import { fail, ok } from "@/server/errors/api";
import { ValidationError } from "@/server/errors/errors";

const verifyParentGateSchema = z.object({
  pin: z.string().regex(/^\d{4}$/),
  childId: z.string().uuid()
});

export async function POST(request: Request) {
  try {
    const body = verifyParentGateSchema.safeParse(await request.json());
    if (!body.success) throw new ValidationError("Parent gate verification payload is invalid.");

    return ok(
      {
        verified: false,
        status: "TODO"
      },
      {
        planned:
          "Hash compare PIN, increment failed attempts, enforce temporary lockout, and require active parent session."
      },
      { status: 501 }
    );
  } catch (error) {
    return fail(error);
  }
}
