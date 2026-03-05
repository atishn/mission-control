import { NextResponse } from "next/server";
import { readFile, readdir } from "fs/promises";
import path from "path";
import { OPENCLAW_ROOT } from "@/lib/config";

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hr ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export async function GET() {
  const now = Date.now();

  // 1. Read all sessions
  const allSessions: Record<string, any> = {};
  for (const dir of ["main", "smarty", "scout"]) {
    try {
      const raw = await readFile(path.join(OPENCLAW_ROOT, `agents/${dir}/sessions/sessions.json`), "utf-8");
      Object.assign(allSessions, JSON.parse(raw));
    } catch {}
  }

  // 2. Agent activity
  const agentMap: Record<string, { name: string; color: string; keys: string[] }> = {
    smarty: { name: "Smarty", color: "var(--accent)", keys: ["agent:smarty:main", "agent:main:main"] },
    scout:  { name: "Scout",  color: "var(--green)",  keys: ["agent:scout:main"] },
  };

  let agentsOnline = 0;
  const recentActivity: { time: string; agent: string; action: string; color: string; timestamp: number }[] = [];

  for (const [, cfg] of Object.entries(agentMap)) {
    const session = cfg.keys.map(k => allSessions[k]).filter(Boolean).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
    if (!session) continue;
    const diff = now - (session.updatedAt || 0);
    if (diff < 30 * 60 * 1000) agentsOnline++;
    recentActivity.push({
      timestamp: session.updatedAt || 0,
      time: formatTime(session.updatedAt || 0),
      agent: cfg.name,
      action: diff < 5 * 60 * 1000 ? "Active session" : diff < 30 * 60 * 1000 ? "Idle" : "Last seen",
      color: cfg.color,
    });
  }

  // 3. Subagent runs
  let activeTasks = 0;
  try {
    const runsRaw = await readFile(path.join(OPENCLAW_ROOT, "subagents/runs.json"), "utf-8");
    const runsData = JSON.parse(runsRaw);
    const runs = Object.values(runsData.runs || {}) as any[];
    activeTasks = runs.filter(r => r.status === "running").length;
    // Add recent completed runs to activity
    runs
      .filter(r => r.completedAt && now - r.completedAt < 2 * 60 * 60 * 1000)
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
      .slice(0, 3)
      .forEach(r => {
        recentActivity.push({
          timestamp: r.completedAt,
          time: formatTime(r.completedAt),
          agent: r.label || "Sub-agent",
          action: `Completed: ${(r.task || "").slice(0, 60)}${(r.task || "").length > 60 ? "…" : ""}`,
          color: "var(--purple)",
        });
      });
  } catch {}

  // 4. Cron jobs
  let scheduledJobs = 0;
  try {
    const cronRaw = await readFile(path.join(OPENCLAW_ROOT, "cron/jobs.json"), "utf-8");
    const cronData = JSON.parse(cronRaw);
    scheduledJobs = (cronData.jobs || []).filter((j: any) => j.enabled !== false).length;
  } catch {}

  // 5. Memory files
  let memoriesToday = 0;
  let documents = 0;
  try {
    const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
    const memDir = path.join(OPENCLAW_ROOT, "workspace/memory");
    const files = await readdir(memDir);
    const mdFiles = files.filter(f => f.endsWith(".md"));
    documents = mdFiles.length;
    const todayFile = mdFiles.find(f => f.startsWith(today));
    if (todayFile) {
      const content = await readFile(path.join(memDir, todayFile), "utf-8");
      memoriesToday = (content.match(/^## /gm) || []).length;
    }
  } catch {}

  recentActivity.sort((a, b) => b.timestamp - a.timestamp);

  return NextResponse.json({
    stats: { agentsOnline, scheduledJobs, memoriesToday, documents, activeTasks },
    recentActivity: recentActivity.slice(0, 6),
  });
}
