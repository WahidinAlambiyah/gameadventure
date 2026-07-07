import { placeholder } from "@/server/errors/api";

export function GET() {
  return placeholder(
    "Return published level metadata without exposing answer rules to the client."
  );
}
