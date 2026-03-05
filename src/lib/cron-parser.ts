/**
 * Minimal cron expression parser for display purposes.
 * Handles standard 5-field cron: minute hour dom month dow
 */

export interface CronSchedule {
  kind: "cron";
  expr: string;
  tz?: string;
}

export interface AtSchedule {
  kind: "at";
  at: string;
}

export type Schedule = CronSchedule | AtSchedule;

export interface ParsedJob {
  id: string;
  name: string;
  agentId: string;
  enabled: boolean;
  schedule: Schedule;
  timezone: string;
  nextRunAt: number | null;
  lastRunAt: number | null;
  lastStatus: string | null;
  payload: string;
  // Derived display fields
  timeLabel: string;
  daysOfWeek: number[]; // 0=Sun..6=Sat
  isOneTime: boolean;
  isAlwaysRunning: boolean;
  frequencyLabel: string;
}

const DOW_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseCronField(field: string, max: number): number[] {
  if (field === "*") return Array.from({ length: max + 1 }, (_, i) => i);

  const values: number[] = [];
  for (const part of field.split(",")) {
    if (part.includes("/")) {
      const [range, stepStr] = part.split("/");
      const step = parseInt(stepStr, 10);
      const start = range === "*" ? 0 : parseInt(range, 10);
      for (let i = start; i <= max; i += step) values.push(i);
    } else if (part.includes("-")) {
      const [lo, hi] = part.split("-").map(Number);
      for (let i = lo; i <= hi; i++) values.push(i);
    } else {
      values.push(parseInt(part, 10));
    }
  }
  return [...new Set(values)].sort((a, b) => a - b);
}

function formatTime(hour: number, minute: number): string {
  const h = hour % 12 || 12;
  const ampm = hour < 12 ? "AM" : "PM";
  const m = minute.toString().padStart(2, "0");
  return `${h}:${m} ${ampm}`;
}

export function parseJob(job: {
  id: string;
  name: string;
  agentId: string;
  enabled?: boolean;
  schedule: Schedule;
  state?: {
    nextRunAtMs?: number;
    lastRunAtMs?: number;
    lastStatus?: string;
    lastRunStatus?: string;
  };
  payload?: { text?: string; message?: string; kind?: string };
}): ParsedJob {
  const schedule = job.schedule;
  const state = job.state || {};

  let timeLabel = "";
  let daysOfWeek: number[] = [];
  let isOneTime = false;
  let isAlwaysRunning = false;
  let frequencyLabel = "";

  if (schedule.kind === "cron") {
    const parts = schedule.expr.split(/\s+/);
    if (parts.length >= 5) {
      const [minField, hourField, , , dowField] = parts;
      const minutes = parseCronField(minField, 59);
      const hours = parseCronField(hourField, 23);
      const dow = parseCronField(dowField, 6);

      daysOfWeek = dow;

      // Check if it runs very frequently (every few minutes)
      if (hourField === "*" && minField.includes("/")) {
        const step = parseInt(minField.split("/")[1], 10);
        isAlwaysRunning = true;
        frequencyLabel = `Every ${step} min`;
        timeLabel = frequencyLabel;
      } else if (hours.length <= 2 && minutes.length <= 2) {
        timeLabel = formatTime(hours[0], minutes[0]);
        if (dow.length === 7) {
          frequencyLabel = "Daily";
        } else if (dow.length === 5 && !dow.includes(0) && !dow.includes(6)) {
          frequencyLabel = "Weekdays";
        } else {
          frequencyLabel = dow.map((d) => DOW_NAMES[d]).join(", ");
        }
      } else {
        // Multiple times per day
        isAlwaysRunning = true;
        frequencyLabel = `${hours.length}x daily`;
        timeLabel = frequencyLabel;
      }
    }
  } else if (schedule.kind === "at") {
    isOneTime = true;
    const d = new Date(schedule.at);
    timeLabel = formatTime(d.getHours(), d.getMinutes());
    daysOfWeek = [d.getDay()];
    frequencyLabel = "One-time";
  }

  return {
    id: job.id,
    name: job.name,
    agentId: job.agentId,
    enabled: job.enabled !== false,
    schedule,
    timezone: schedule.kind === "cron" ? (schedule.tz || "UTC") : "UTC",
    nextRunAt: state.nextRunAtMs || null,
    lastRunAt: state.lastRunAtMs || null,
    lastStatus: state.lastRunStatus || state.lastStatus || null,
    payload: job.payload?.text || job.payload?.message || "",
    timeLabel,
    daysOfWeek,
    isOneTime,
    isAlwaysRunning,
    frequencyLabel,
  };
}

/**
 * Given a date, return the Sunday..Saturday range for that week.
 */
export function getWeekDates(date: Date): Date[] {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(d);
    dd.setDate(dd.getDate() + i);
    return dd;
  });
}

export function formatDateShort(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
