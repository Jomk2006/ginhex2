import { notFound } from "next/navigation";

// Catch-all so unknown URLs under /en/* and /ar/* render the localized 404
// (with a real 404 status) inside the marketing layout.
export default function CatchAll() {
  notFound();
}
