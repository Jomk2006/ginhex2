"use client";

import { useMemo, useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { markAttendanceAction, markAllPresentAction } from "@/actions/attendance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ATTENDANCE_STATUS_LABELS } from "@/types/domain";
import type { AttendanceStatus } from "@/types/domain";
import { cn } from "@/lib/utils";

interface RosterRow {
  studentId: string;
  fullNameEn: string;
  fullNameAr: string;
  genhexId: string;
  record: { status: AttendanceStatus } | null;
}

const STATUS_OPTIONS: AttendanceStatus[] = ["present", "absent", "late", "excused"];

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: "bg-[#00BCC8] text-[#0A0A0A]",
  absent: "bg-destructive text-destructive-foreground",
  late: "bg-amber-400 text-[#0A0A0A]",
  excused: "bg-muted text-muted-foreground",
};

export function AttendanceRoster({ sessionId, roster }: { sessionId: string; roster: RosterRow[] }) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [rows, setRows] = useState(roster);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.fullNameEn.toLowerCase().includes(q) ||
        r.fullNameAr.toLowerCase().includes(q) ||
        r.genhexId.toLowerCase().includes(q)
    );
  }, [rows, search]);

  function setStatus(studentId: string, status: AttendanceStatus) {
    setRows((prev) => prev.map((r) => (r.studentId === studentId ? { ...r, record: { status } } : r)));
    startTransition(async () => {
      await markAttendanceAction(sessionId, studentId, status);
    });
  }

  function markAllPresent() {
    const unmarked = rows.filter((r) => !r.record).map((r) => r.studentId);
    if (unmarked.length === 0) return;
    setRows((prev) => prev.map((r) => (r.record ? r : { ...r, record: { status: "present" as AttendanceStatus } })));
    startTransition(async () => {
      await markAllPresentAction(sessionId, unmarked);
    });
  }

  const markedCount = rows.filter((r) => r.record).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder={isAr ? "ابحث بالاسم أو معرّف GENHEX..." : "Search by name or GENHEX ID..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {markedCount}/{rows.length} {isAr ? "تم تحديدهم" : "marked"}
          </span>
          <Button size="sm" variant="outline" onClick={markAllPresent} disabled={isPending}>
            {isAr ? "تحديد الكل حاضر" : "Mark all present"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
        {filtered.map((row) => (
          <div key={row.studentId} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">{isAr ? row.fullNameAr : row.fullNameEn}</p>
              <p className="font-mono text-xs text-muted-foreground">{row.genhexId}</p>
            </div>
            <div className="flex gap-1.5">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={isPending}
                  onClick={() => setStatus(row.studentId, status)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-opacity",
                    row.record?.status === status ? STATUS_COLORS[status] : "bg-muted text-muted-foreground hover:opacity-80"
                  )}
                >
                  {ATTENDANCE_STATUS_LABELS[status][isAr ? "ar" : "en"]}
                </button>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            {isAr ? "لا يوجد طلاب مطابقون." : "No matching students."}
          </p>
        )}
      </div>
    </div>
  );
}
