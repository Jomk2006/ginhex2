import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decodeJwtClaims } from "@/lib/auth/decode-claims";
import { ROLE_HOME_PATH } from "@/types/domain";

// Handles the redirect back from both Google OAuth and Supabase email
// links (password reset, sign-up confirmation) — both use the PKCE
// `code` exchange flow.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(`${origin}/en/sign-in?error=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/en/sign-in?error=auth_callback_failed`);
  }

  if (next) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  const claims = decodeJwtClaims(data.session.access_token);
  const role = claims.user_role ?? "student";
  return NextResponse.redirect(`${origin}/en${ROLE_HOME_PATH[role]}`);
}
