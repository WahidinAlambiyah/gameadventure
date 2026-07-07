import { placeholder } from "@/server/errors/api";

export function GET() {
  return placeholder("List children with server-side parent ownership scope.");
}

export function POST() {
  return placeholder(
    "Create one MVP child profile after validating parent ownership and profile limits."
  );
}
