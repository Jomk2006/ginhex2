// ⚠️ This file should be regenerated from the live database, not hand-maintained:
//
//   supabase gen types typescript --project-id <project-ref> --schema public > types/database.types.ts
//
// The schema is already live in Supabase (26 tables, all enums, RLS, triggers,
// functions — per the approved GENHEX schema design). Run the command above
// against it to get the full, authoritative file. The slice below covers the
// tables Phase 1 (identity & auth) actually touches so the app compiles now;
// every other table follows an identical Row/Insert/Update/Relationships shape.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["user_role"];
          full_name_en: string;
          full_name_ar: string;
          avatar_url: string | null;
          phone: string | null;
          locale_preference: string;
          theme_preference: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: Database["public"]["Enums"]["user_role"];
          full_name_en: string;
          full_name_ar: string;
          avatar_url?: string | null;
          phone?: string | null;
          locale_preference?: string;
          theme_preference?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };

      courses: {
        Row: {
          id: string;
          slug: string;
          title_en: string;
          title_ar: string;
          description_en: string | null;
          description_ar: string | null;
          cover_image_url: string | null;
          instructor_id: string;
          category: string | null;
          level: Database["public"]["Enums"]["course_level"] | null;
          status: Database["public"]["Enums"]["course_status"];
          enrollment_mode: Database["public"]["Enums"]["enrollment_mode"];
          application_form_id: string | null;
          exam_requirement: Database["public"]["Enums"]["exam_requirement_type"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title_en: string;
          title_ar: string;
          description_en?: string | null;
          description_ar?: string | null;
          cover_image_url?: string | null;
          instructor_id: string;
          category?: string | null;
          level?: Database["public"]["Enums"]["course_level"] | null;
          status?: Database["public"]["Enums"]["course_status"];
          enrollment_mode?: Database["public"]["Enums"]["enrollment_mode"];
          application_form_id?: string | null;
          exam_requirement?: Database["public"]["Enums"]["exam_requirement_type"];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["courses"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "courses_instructor_id_fkey";
            columns: ["instructor_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "courses_application_form_id_fkey";
            columns: ["application_form_id"];
            referencedRelation: "forms";
            referencedColumns: ["id"];
          }
        ];
      };

      exam_attempts: {
        Row: {
          id: string;
          exam_id: string;
          student_id: string;
          attempt_number: number;
          attendance_percent_at_start: number;
          started_at: string;
          submitted_at: string | null;
          status: Database["public"]["Enums"]["attempt_status"];
          score_percent: number | null;
          passed: boolean | null;
        };
        // Rows are created only via the start_exam_attempt() RPC
        // (service-role), never via a direct table insert.
        Insert: never;
        Update: Partial<{
          status: Database["public"]["Enums"]["attempt_status"];
          submitted_at: string;
          score_percent: number;
          passed: boolean;
        }>;
        Relationships: [
          {
            foreignKeyName: "exam_attempts_exam_id_fkey";
            columns: ["exam_id"];
            referencedRelation: "exams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exam_attempts_student_id_fkey";
            columns: ["student_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };

      // ...remaining 23 tables (course_instructors, modules, lessons,
      // enrollments, lesson_progress, attendance_sessions, attendance_records,
      // attendance_import_batches, exams, exam_questions, exam_answers,
      // certificate_templates, certificates, forms, form_submissions,
      // events, event_registrations, labs_projects, labs_collaborators,
      // resources, notifications, audit_logs, background_jobs) follow the
      // identical pattern — generate the full file rather than hand-extending
      // this stub once you're ready to build those features.
    };
    Views: Record<string, never>;
    Functions: {
      attendance_percent: {
        Args: { student_id: string; course_id: string };
        Returns: number;
      };
      certificate_eligibility: {
        Args: { student_id: string; course_id: string };
        Returns: { eligible: boolean; qualifying_score: number | null };
      };
    };
    Enums: {
      user_role: "student" | "instructor" | "admin";
      course_status: "draft" | "published" | "archived";
      course_level: "beginner" | "intermediate" | "advanced";
      enrollment_mode: "open" | "application";
      exam_requirement_type: "required" | "optional" | "none";
      enrollment_status: "active" | "completed" | "withdrawn";
      attendance_mode: "onsite" | "online";
      attendance_status: "present" | "absent" | "late" | "excused";
      attendance_record_source: "manual" | "import";
      import_batch_status: "pending" | "committed" | "failed";
      exam_status: "draft" | "published" | "closed";
      question_type: "mcq" | "true_false" | "short_answer";
      attempt_status: "in_progress" | "submitted" | "graded";
      certificate_status: "active" | "revoked";
      form_type: "application" | "event_registration" | "general";
      submission_status: "pending" | "under_review" | "approved" | "rejected";
      event_type: "workshop" | "masterclass" | "lab_session" | "community";
      event_location_mode: "onsite" | "online";
      event_status: "draft" | "published" | "completed" | "cancelled";
      capacity_mode: "hard_limit" | "waitlist";
      registration_status: "registered" | "attended" | "no_show" | "cancelled" | "waitlisted";
      labs_project_status: "idea" | "prototype" | "shipped";
      resource_type: "pdf" | "link" | "video" | "dataset";
      resource_visibility: "public" | "enrolled_only" | "instructors_only";
      job_status: "queued" | "processing" | "done" | "failed";
    };
  };
}
