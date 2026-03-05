"use client";

import { useEffect, useState, useCallback } from "react";
import { parseJob, getWeekDates, formatDateShort, type ParsedJob } from "@/lib/cron-parser";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Power,
} from "lucide-react";

// Color palette for jobs — cycles through these
const JOB_COLORS = [
  "var(--red)",
  "var(--orange)",
  "var(--yellow)",
  "var(--green)",
  "var(--blue)",
  "var(--purple)",
  "var(--cyan)",
];

function getJobColor(index: number): string {
  return JOB_COLORS[index % JOB_COLORS.length];
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const [jobs, setJobs] = useState<ParsedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedJob, setSelectedJob] = useState<ParsedJob | null>(null);
  const [view, setView] = useState<"week" | "today">("week");

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/cron-jobs");
      const data = await res.json();
      const parsed = (data.jobs || []).map(parseJob);
      setJobs(parsed);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const now = new Date();
  const weekBase = new Date(now);
  weekBase.setDate(weekBase.getDate() + weekOffset * 7);
  const weekDates = getWeekDates(weekBase);
  const todayDow = now.getDay();

  const alwaysRunning = jobs.filter((j) => j.isAlwaysRunning && j.enabled);
  const recurringJobs = jobs.filter((j) => !j.isAlwaysRunning && !j.isOneTime && j.enabled);
  const oneTimeJobs = jobs.filter((j) => j.isOneTime && j.enabled);
  const disabledJobs = jobs.filter((j) => !j.enabled);

  // For "today" view, include both recurring and one-time jobs for today
  const todayJobs = [
    ...recurringJobs.filter((j) => j.daysOfWeek.includes(todayDow)),
    ...oneTimeJobs.filter((j) => {
      if (j.schedule.kind !== "at") return false;
      const jobDate = new Date(j.schedule.at);
      return jobDate.getDay() === todayDow && weekOffset === 0;
    }),
  ];

  function getJobsForDay(dow: number): ParsedJob[] {
    return recurringJobs
      .filter((j) => j.daysOfWeek.includes(dow))
      .sort((a, b) => a.timeLabel.localeCompare(b.timeLabel));
  }

  function StatusIcon({ status }: { status: string | null }) {
    if (!status) return <Clock size={12} style={{ color: "var(--text-muted)" }} />;
    if (status === "ok") return <CheckCircle2 size={12} style={{ color: "var(--green)" }} />;
    if (status === "error") return <XCircle size={12} style={{ color: "var(--red)" }} />;
    return <AlertCircle size={12} style={{ color: "var(--yellow)" }} />;
  }

  function isToday(dow: number): boolean {
    return weekOffset === 0 && dow === todayDow;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Scheduled Tasks
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Smarty&apos;s automated routines
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Week navigation */}
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="p-1.5 rounded-md transition-colors"
            style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="px-2.5 py-1 rounded-md text-xs"
            style={{
              background: weekOffset === 0 ? "var(--bg-hover)" : "var(--bg-tertiary)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            This Week
          </button>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="p-1.5 rounded-md transition-colors"
            style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
          >
            <ChevronRight size={16} />
          </button>

          <div className="w-px h-6 mx-1" style={{ background: "var(--border)" }} />

          {/* View toggle */}
          <button
            onClick={() => setView("week")}
            className="px-3 py-1.5 rounded-md text-xs font-medium"
            style={{
              background: view === "week" ? "var(--accent)" : "var(--bg-tertiary)",
              color: view === "week" ? "white" : "var(--text-secondary)",
              border: view === "week" ? "none" : "1px solid var(--border)",
            }}
          >
            Week
          </button>
          <button
            onClick={() => setView("today")}
            className="px-3 py-1.5 rounded-md text-xs"
            style={{
              background: view === "today" ? "var(--accent)" : "var(--bg-tertiary)",
              color: view === "today" ? "white" : "var(--text-secondary)",
              border: view === "today" ? "none" : "1px solid var(--border)",
            }}
          >
            Today
          </button>
        </div>
      </div>

      {/* Always Running */}
      {alwaysRunning.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} style={{ color: "var(--yellow)" }} />
            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Always Running
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {alwaysRunning.map((job, i) => (
              <button
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className="px-3 py-1.5 rounded-full text-xs transition-colors cursor-pointer"
                style={{
                  background: "var(--bg-tertiary)",
                  color: "var(--text-secondary)",
                  border: `1px solid ${getJobColor(i)}`,
                }}
              >
                {job.name} &middot; {job.frequencyLabel}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Disabled jobs notice */}
      {disabledJobs.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <Power size={12} style={{ color: "var(--text-muted)" }} />
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {disabledJobs.length} disabled job{disabledJobs.length > 1 ? "s" : ""}: {disabledJobs.map((j) => j.name).join(", ")}
          </span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>Loading cron jobs...</span>
        </div>
      ) : view === "week" ? (
        /* ===== WEEK VIEW ===== */
        <div
          className="rounded-lg border overflow-hidden"
          style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
        >
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b" style={{ borderColor: "var(--border)" }}>
            {weekDates.map((date, i) => (
              <div
                key={i}
                className="px-2 py-2.5 text-center border-r last:border-r-0"
                style={{ borderColor: "var(--border)" }}
              >
                <span
                  className="text-xs font-medium"
                  style={{ color: isToday(i) ? "var(--accent)" : "var(--text-secondary)" }}
                >
                  {DAY_NAMES[i]}
                </span>
                <span
                  className="text-[10px] ml-1.5"
                  style={{ color: isToday(i) ? "var(--accent)" : "var(--text-muted)" }}
                >
                  {formatDateShort(date)}
                </span>
              </div>
            ))}
          </div>

          {/* Calendar body */}
          <div className="grid grid-cols-7">
            {DAY_NAMES.map((_, dayIndex) => {
              const dayJobs = getJobsForDay(dayIndex);
              return (
                <div
                  key={dayIndex}
                  className="min-h-[420px] p-1.5 border-r last:border-r-0 space-y-1"
                  style={{
                    borderColor: "var(--border)",
                    background: isToday(dayIndex) ? "rgba(99, 102, 241, 0.03)" : "transparent",
                  }}
                >
                  {dayJobs.map((job) => {
                    const colorIdx = jobs.indexOf(job);
                    const color = getJobColor(colorIdx);
                    return (
                      <button
                        key={job.id}
                        onClick={() => setSelectedJob(job)}
                        className="w-full text-left rounded px-2 py-1.5 cursor-pointer transition-opacity hover:opacity-80"
                        style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}
                      >
                        <div className="flex items-center gap-1">
                          <StatusIcon status={job.lastStatus} />
                          <p className="text-[11px] font-medium truncate" style={{ color }}>
                            {job.name}
                          </p>
                        </div>
                        <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {job.timeLabel}
                        </p>
                      </button>
                    );
                  })}
                  {/* One-time jobs that fall on this specific date */}
                  {jobs
                    .filter((j) => {
                      if (!j.isOneTime || !j.enabled) return false;
                      if (j.schedule.kind !== "at") return false;
                      const jobDate = new Date(j.schedule.at);
                      const cellDate = weekDates[dayIndex];
                      return (
                        jobDate.getFullYear() === cellDate.getFullYear() &&
                        jobDate.getMonth() === cellDate.getMonth() &&
                        jobDate.getDate() === cellDate.getDate()
                      );
                    })
                    .map((job) => {
                      const colorIdx = jobs.indexOf(job);
                      const color = getJobColor(colorIdx);
                      return (
                        <button
                          key={job.id}
                          onClick={() => setSelectedJob(job)}
                          className="w-full text-left rounded px-2 py-1.5 cursor-pointer transition-opacity hover:opacity-80"
                          style={{
                            background: `color-mix(in srgb, ${color} 15%, transparent)`,
                            border: `1px dashed ${color}`,
                          }}
                        >
                          <div className="flex items-center gap-1">
                            <Clock size={10} style={{ color }} />
                            <p className="text-[11px] font-medium truncate" style={{ color }}>
                              {job.name}
                            </p>
                          </div>
                          <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {job.timeLabel} &middot; One-time
                          </p>
                        </button>
                      );
                    })}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ===== TODAY VIEW ===== */
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {todayJobs.length} scheduled task{todayJobs.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="space-y-2">
            {todayJobs.map((job) => {
              const colorIdx = jobs.indexOf(job);
              const color = getJobColor(colorIdx);
              return (
                <button
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className="w-full text-left rounded-lg p-4 border cursor-pointer transition-colors"
                  style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-8 rounded-full" style={{ background: color }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          {job.name}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {job.timeLabel} &middot; {job.agentId === "main" ? "Smarty" : job.agentId} &middot; {job.timezone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon status={job.lastStatus} />
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {job.lastStatus || "pending"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
            {todayJobs.length === 0 && (
              <div className="text-center py-12">
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                  No scheduled tasks for today
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Job Detail Panel */}
      {selectedJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setSelectedJob(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl p-6 border"
            style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                {selectedJob.name}
              </h2>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-xs px-2 py-1 rounded"
                style={{ color: "var(--text-muted)" }}
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <DetailRow label="Agent" value={selectedJob.agentId === "main" ? "Smarty" : selectedJob.agentId} />
              <DetailRow label="Schedule" value={
                selectedJob.schedule.kind === "cron"
                  ? `${selectedJob.schedule.expr} (${selectedJob.timezone})`
                  : `One-time: ${new Date(selectedJob.schedule.at).toLocaleString()}`
              } />
              <DetailRow label="Frequency" value={selectedJob.frequencyLabel} />
              <DetailRow label="Time" value={selectedJob.timeLabel} />
              <DetailRow
                label="Days"
                value={
                  selectedJob.daysOfWeek.length === 7
                    ? "Every day"
                    : selectedJob.daysOfWeek.map((d) => DAY_NAMES[d]).join(", ")
                }
              />
              <DetailRow label="Status" value={selectedJob.enabled ? "Enabled" : "Disabled"} />
              <DetailRow label="Last Run" value={
                selectedJob.lastRunAt
                  ? `${new Date(selectedJob.lastRunAt).toLocaleString()} — ${selectedJob.lastStatus || "unknown"}`
                  : "Never"
              } />
              <DetailRow label="Next Run" value={
                selectedJob.nextRunAt
                  ? new Date(selectedJob.nextRunAt).toLocaleString()
                  : "—"
              } />

              {selectedJob.payload && (
                <div>
                  <span className="text-[11px] font-medium block mb-1" style={{ color: "var(--text-secondary)" }}>
                    Payload
                  </span>
                  <div
                    className="rounded-md p-3 text-xs leading-relaxed max-h-40 overflow-y-auto"
                    style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                  >
                    {selectedJob.payload}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[11px] font-medium w-20 flex-shrink-0 pt-0.5" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>
      <span className="text-xs" style={{ color: "var(--text-primary)" }}>
        {value}
      </span>
    </div>
  );
}
