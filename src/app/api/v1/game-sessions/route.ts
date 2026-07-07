import { placeholder } from "@/server/errors/api";

export function POST() {
  return placeholder(
    "Start a game session, consume energy once, and return server-issued session state."
  );
}
