import { NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import { OPENCLAW_ROOT } from "@/lib/config";

interface AgentStatus {
  id: string;
  name: string;
  emoji: string;
  color: string;
  status: "working" | "idle" | "offline" | "standup";
  currentTask?: string;
  lastActivity?: number;
}

const AGENT_CONFIGS = [
  { id: "smarty", name: "Smarty", emoji: "💡", color: "var(--accent)", agentId: "smarty", agentIdFallback: "main" },
  { id: "scout", name: "Scout", emoji: "🔍", color: "var(--green)", agentId: "scout" },
  { id: "architect", name: "Architect", emoji: "🏗️", color: "var(--blue)", subagent: true },
  { id: "developer", name: "Developer", emoji: "⚡", color: "var(--purple)", subagent: true },
  { id: "tester", name: "Tester", emoji: "🧪", color: "var(--orange)", subagent: true },
  { id: "designer", name: "Designer", emoji: "🎨", color: "var(--cyan)", subagent: true },
  { id: "planner", name: "Planner", emoji: "📋", color: "var(--yellow)", subagent: true },
  { id: "researcher", name: "Researcher", emoji: "📚", color: "var(--red)", subagent: true },
];

export async function GET() {
  try {
    const now = Date.now();
    const agents: AgentStatus[] = [];

    // Read sessions from all agent dirs and merge
    let sessions: Record<string, any> = {};
    for (const dir of ["main", "smarty", "scout"]) {
      try {
        const raw = await readFile(path.join(OPENCLAW_ROOT, `agents/${dir}/sessions/sessions.json`), "utf-8");
        Object.assign(sessions, JSON.parse(raw));
      } catch {}
    }

    // Read subagent runs
    const subagentRunsPath = path.join(OPENCLAW_ROOT, "subagents/runs.json");
    let subagentRuns: Record<string, any> = {};
    try {
      const runsRaw = await readFile(subagentRunsPath, "utf-8");
      const runsData = JSON.parse(runsRaw);
      subagentRuns = runsData.runs || {};
    } catch {
      // Runs file doesn't exist
    }

    // Process each agent
    for (const config of AGENT_CONFIGS) {
      if (config.subagent) {
        // Check if this sub-agent has active runs
        const activeRuns = Object.values(subagentRuns).filter((run: any) => {
          return (
            run.label?.toLowerCase().includes(config.id) &&
            run.status === "running"
          );
        });

        if (activeRuns.length > 0) {
          const run = activeRuns[0] as any;
          agents.push({
            ...config,
            status: "working",
            currentTask: run.task || `Active run`,
            lastActivity: run.startedAt || now,
          });
        } else {
          // Check for recent completed runs
          const recentRuns = Object.values(subagentRuns).filter((run: any) => {
            return (
              run.label?.toLowerCase().includes(config.id) &&
              run.completedAt &&
              now - run.completedAt < 5 * 60 * 1000 // Last 5 minutes
            );
          });

          if (recentRuns.length > 0) {
            agents.push({
              ...config,
              status: "idle",
              lastActivity: (recentRuns[0] as any).completedAt,
            });
          } else {
            agents.push({
              ...config,
              status: "offline",
            });
          }
        }
      } else {
        // Lead agent (Smarty or Scout) — use sessions.json mtime for accurate activity
        const sessionKey = `agent:${config.agentId}:main`;
        const fallbackKey = (config as any).agentIdFallback ? `agent:${(config as any).agentIdFallback}:main` : null;
        const session = sessions[sessionKey] || (fallbackKey ? sessions[fallbackKey] : null);

        // JSONL transcript mtime is most accurate — appended to with every message
        const agentDirs = [config.agentId, (config as any).agentIdFallback].filter(Boolean);
        let lastActivity = session?.updatedAt || 0;

        if (session?.sessionId) {
          for (const dir of agentDirs) {
            try {
              const fileStat = await stat(path.join(OPENCLAW_ROOT, `agents/${dir}/sessions/${session.sessionId}.jsonl`));
              lastActivity = Math.max(lastActivity, fileStat.mtimeMs);
              break;
            } catch {}
          }
        }

        // Fallback: sessions.json mtime
        if (lastActivity === (session?.updatedAt || 0)) {
          for (const dir of agentDirs) {
            try {
              const fileStat = await stat(path.join(OPENCLAW_ROOT, `agents/${dir}/sessions/sessions.json`));
              lastActivity = Math.max(lastActivity, fileStat.mtimeMs);
            } catch {}
          }
        }

        if (lastActivity > 0) {
          const timeSinceUpdate = now - lastActivity;
          if (timeSinceUpdate < 5 * 60 * 1000) {
            agents.push({ ...config, status: "working", currentTask: session?.lastHeartbeatText || "Active session", lastActivity });
          } else if (timeSinceUpdate < 30 * 60 * 1000) {
            agents.push({ ...config, status: "idle", lastActivity });
          } else {
            agents.push({ ...config, status: "offline", lastActivity });
          }
        } else {
          agents.push({ ...config, status: "offline" });
        }
      }
    }

    return NextResponse.json({ agents });
  } catch (err) {
    console.error("Failed to read agent status:", err);
    return NextResponse.json({ agents: [] });
  }
}
