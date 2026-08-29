import type { GenhexJwtClaims } from "@/types/domain";

/**
 * Decodes (does NOT re-verify — Supabase already verified it when the
 * session was refreshed in updateSession()) the JWT payload to read
 * the custom `user_role` claim for routing decisions in middleware.
 *
 * Used for UX only (which dashboard to redirect to, which nav to show).
 * Actual authorization always happens at the RLS layer in Postgres.
 */
export function decodeJwtClaims(accessToken: string): GenhexJwtClaims {
  try {
    const payload = accessToken.split(".")[1];
    if (!payload) return {};
    const decoded = Buffer.from(payload, "base64url").toString("utf-8");
    return JSON.parse(decoded) as GenhexJwtClaims;
  } catch {
    return {};
  }
}
