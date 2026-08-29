import type { Database } from "@/types/database.types";

export type UserRole = Database["public"]["Enums"]["user_role"];
export const USER_ROLES: readonly UserRole[] = ["student", "instructor", "admin"];

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Course = Database["public"]["Tables"]["courses"]["Row"];

export type Locale = "en" | "ar";
export const LOCALES: readonly Locale[] = ["en", "ar"];
export const DEFAULT_LOCALE: Locale = "en";

/**
 * The shape of the custom claim injected into the Supabase JWT by the
 * Auth Hook (from profiles.role). Read from the decoded access token —
 * this is a UX/routing convenience ONLY. It is never treated as an
 * authorization decision on its own; RLS on the database is the real
 * enforcement boundary per the approved schema design.
 */
export interface GenhexJwtClaims {
  user_role?: UserRole;
  [key: string]: unknown;
}

/** Where the role-aware dashboard root lives, per role. */
export const ROLE_HOME_PATH: Record<UserRole, string> = {
  student: "/app/student",
  instructor: "/app/instructor",
  admin: "/app/admin",
};

/** Prefix → role this segment is restricted to, checked in middleware.ts. */
export const ROLE_SEGMENT_GUARDS: Array<{ prefix: string; role: UserRole }> = [
  { prefix: "/app/student", role: "student" },
  { prefix: "/app/instructor", role: "instructor" },
  { prefix: "/app/admin", role: "admin" },
];

export const ROLE_LABELS: Record<UserRole, { en: string; ar: string }> = {
  student: { en: "Student", ar: "طالب" },
  instructor: { en: "Instructor", ar: "مدرّب" },
  admin: { en: "Admin", ar: "مسؤول" },
};
