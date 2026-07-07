import { placeholder } from "@/server/errors/api";

export function GET() {
  return placeholder("Return parent dashboard summary scoped to the authenticated parent profile.");
}
