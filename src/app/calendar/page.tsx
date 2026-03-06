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
  Plus,
  X,
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

  // Add event modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [agents, setAgents] = useState<{ id: string; name: string; emoji: string }[]>([]);
  const [addForm, setAddForm] = useState({
    name: "",
    description: "",
    agentId: "smarty",
    type: "recurring" as "one-time" | "recurring",
    date: new Date().toISOString().split("T")[0],
    time: "09:00",
    days: [1, 2, 3, 4, 5] as number[],
    timezone: "America/New_York",
  });

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

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((d) => setAgents(d.agents || []))
      .catch(() => {});
  }, []);

  async function handleAddEvent() {
    if (!addForm.name.trim()) return;
    setSubmitting(true);
    try {
      let schedule;
      if (addForm.type === "one-time") {
        schedule = { kind: "at", at: new Date(`${addForm.date}T${addForm.time}:00`).toISOString() };
      } else {
        const [hour, minute] = addForm.time.split(":").map(Number);
        const dowExpr = addForm.days.length === 7 ? "*" : addForm.days.join(",");
        schedule = { kind: "cron", expr: `${minute} ${hour} * * ${dowExpr}`, tz: addForm.timezone };
      }
      await fetch("/api/cron-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addForm.name.trim(),
          description: addForm.description.trim(),
          agentId: addForm.agentId,
          schedule,
        }),
      });
      setShowAddModal(false);
      setAddForm((f) => ({ ...f, name: "", description: "" }));
      fetchJobs();
    } finally {
      setSubmitting(false);
    }
  }

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

          <div className="w-px h-6 mx-1" style={{ background: "var(--border)" }} />

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium"
            style={{ background: "var(--accent)", color: "white" }}
          >
            <Plus size={13} />
            Add Event
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

      {/* Add Event Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border overflow-hidden"
            style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>New Event</h2>
              <button onClick={() => setShowAddModal(false)} style={{ color: "var(--text-muted)" }}>
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <div className="px-5 py-4 space-y-4">
              {/* Name */}
              <input
                type="text"
                placeholder="Event name"
                value={addForm.name}
                onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-md px-3 py-2 text-sm outline-none"
                style={{
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              />

              {/* Description / Task */}
              <textarea
                placeholder="Task description — this is what the agent will execute"
                value={addForm.description}
                onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full rounded-md px-3 py-2 text-sm outline-none resize-none"
                style={{
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              />

              {/* Agent */}
              <div>
                <label className="text-[11px] font-medium block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Assign to agent
                </label>
                <select
                  value={addForm.agentId}
                  onChange={(e) => setAddForm((f) => ({ ...f, agentId: e.target.value }))}
                  className="w-full rounded-md px-3 py-2 text-sm outline-none"
                  style={{
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  {agents.length > 0
                    ? agents.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.emoji} {a.name}
                        </option>
                      ))
                    : [
                        { id: "smarty", name: "Smarty", emoji: "💡" },
                        { id: "scout", name: "Scout", emoji: "🔍" },
                        { id: "developer", name: "Developer", emoji: "⚡" },
                        { id: "researcher", name: "Researcher", emoji: "📚" },
                      ].map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.emoji} {a.name}
                        </option>
                      ))}
                </select>
              </div>

              {/* Schedule type toggle */}
              <div>
                <label className="text-[11px] font-medium block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Schedule
                </label>
                <div className="flex rounded-md overflow-hidden border" style={{ borderColor: "var(--border)" }}>
                  {(["recurring", "one-time"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setAddForm((f) => ({ ...f, type: t }))}
                      className="flex-1 py-1.5 text-xs font-medium capitalize"
                      style={{
                        background: addForm.type === t ? "var(--accent)" : "var(--bg-tertiary)",
                        color: addForm.type === t ? "white" : "var(--text-secondary)",
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* One-time: date + time */}
              {addForm.type === "one-time" && (
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={addForm.date}
                    onChange={(e) => setAddForm((f) => ({ ...f, date: e.target.value }))}
                    className="flex-1 rounded-md px-3 py-2 text-sm outline-none"
                    style={{
                      background: "var(--bg-tertiary)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <input
                    type="time"
                    value={addForm.time}
                    onChange={(e) => setAddForm((f) => ({ ...f, time: e.target.value }))}
                    className="w-32 rounded-md px-3 py-2 text-sm outline-none"
                    style={{
                      background: "var(--bg-tertiary)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              )}

              {/* Recurring: days + time */}
              {addForm.type === "recurring" && (
                <div className="space-y-2">
                  <div className="flex gap-1">
                    {DAY_NAMES.map((d, i) => (
                      <button
                        key={i}
                        onClick={() =>
                          setAddForm((f) => ({
                            ...f,
                            days: f.days.includes(i) ? f.days.filter((x) => x !== i) : [...f.days, i].sort(),
                          }))
                        }
                        className="flex-1 py-1 rounded text-[11px] font-medium"
                        style={{
                          background: addForm.days.includes(i) ? "var(--accent)" : "var(--bg-tertiary)",
                          color: addForm.days.includes(i) ? "white" : "var(--text-muted)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  <input
                    type="time"
                    value={addForm.time}
                    onChange={(e) => setAddForm((f) => ({ ...f, time: e.target.value }))}
                    className="w-full rounded-md px-3 py-2 text-sm outline-none"
                    style={{
                      background: "var(--bg-tertiary)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t" style={{ borderColor: "var(--border)" }}>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-1.5 rounded-md text-xs"
                style={{ color: "var(--text-secondary)", background: "var(--bg-tertiary)", border: "1px solid var(--border)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddEvent}
                disabled={submitting || !addForm.name.trim()}
                className="px-4 py-1.5 rounded-md text-xs font-medium"
                style={{
                  background: addForm.name.trim() ? "var(--accent)" : "var(--bg-hover)",
                  color: addForm.name.trim() ? "white" : "var(--text-muted)",
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? "Creating..." : "Create Event"}
              </button>
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
