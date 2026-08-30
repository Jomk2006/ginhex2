"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { clientEnv } from "@/lib/env";
import {
  signInSchema,
  signUpSchema,
  resetPasswordSchema,
  updatePasswordSchema,
} from "@/lib/validation/auth";
import { ROLE_HOME_PATH } from "@/types/domain";
import { decodeJwtClaims } from "@/lib/auth/decode-claims";

export interface AuthActionState {
  error?: string;
  success?: string;
}

function localePrefix(formData: FormData) {
  const locale = String(formData.get("locale") ?? "en");
  return locale === "ar" ? "/ar" : "/en";
}

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "invalidCredentials" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.session) {
    return { error: "invalidCredentials" };
  }

  const claims = decodeJwtClaims(data.session.access_token);
  const role = claims.user_role ?? "student";
  redirect(`${localePrefix(formData)}${ROLE_HOME_PATH[role]}`);
}

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    fullNameEn: formData.get("fullNameEn"),
    fullNameAr: formData.get("fullNameAr"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "generic" };
  }

  const supabase = await createClient();
  // full_name_en / full_name_ar are passed as user metadata — the existing
  // Postgres trigger (already live on the schema) reads this metadata to
  // populate the NOT NULL profiles.full_name_en/full_name_ar columns on
  // auth.users insert. This action does not write to profiles directly.
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name_en: parsed.data.fullNameEn,
        full_name_ar: parsed.data.fullNameAr,
      },
      emailRedirectTo: `${clientEnv.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message.toLowerCase().includes("already") ? "emailInUse" : "generic" };
  }

  // If email confirmation is required, there is no session yet.
  if (!data.session) {
    return { success: "confirmEmail" };
  }

  const claims = decodeJwtClaims(data.session.access_token);
  const role = claims.user_role ?? "student";
  redirect(`${localePrefix(formData)}${ROLE_HOME_PATH[role]}`);
}

export async function requestPasswordResetAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: "generic" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${clientEnv.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${localePrefix(
      formData
    )}/update-password`,
  });

  // Deliberately do not reveal whether the email exists — same success
  // message either way to avoid account enumeration.
  if (error) {
    return { error: "generic" };
  }
  return { success: "resetEmailSent" };
}

export async function updatePasswordAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = updatePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message === "passwordMismatch" ? "passwordMismatch" : "weakPassword" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { error: "generic" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const claims = decodeJwtClaims(session?.access_token ?? "");
  const role = claims.user_role ?? "student";

  if (!user) {
    redirect(`${localePrefix(formData)}/sign-in`);
  }
  redirect(`${localePrefix(formData)}${ROLE_HOME_PATH[role]}`);
}

export async function signInWithGoogleAction(formData: FormData): Promise<void> {
  const locale = String(formData.get("locale") ?? "en");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${clientEnv.NEXT_PUBLIC_SITE_URL}/auth/callback?locale=${locale}`,
    },
  });

  if (error || !data.url) {
    redirect(`${localePrefix(formData)}/sign-in?error=oauth`);
  }
  redirect(data.url);
}

export async function signOutAction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`${localePrefix(formData)}/sign-in`);
}
