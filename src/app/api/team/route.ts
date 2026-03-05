import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { OPENCLAW_ROOT } from "@/lib/config";

interface AgentConfig {
  id: string;
  name: string;
  default?: boolean;
  workspace: string;
  model?: { primary?: string };
  tools?: { allow?: string[]; deny?: string[] };
}

interface SubAgentDef {
  id: string;
  name: string;
  role: string;
  description: string;
  model: string;
  tools: string[];
  spawnFor: string;
  whenToUse: string;
}

// Parse sub-agent definitions from AGENTS.md
function parseSubAgents(markdown: string): SubAgentDef[] {
  const agents: SubAgentDef[] = [];
  // Match ### <name> sections under "Sub-Agent Roles"
  const subAgentSection = markdown.split(/## Sub-Agent Roles/i)[1];
  if (!subAgentSection) return agents;

  const blocks = subAgentSection.split(/### (?=\w)/);
  for (const block of blocks) {
    if (!block.trim() || block.startsWith("Sub-Agent Spawn") || block.startsWith("Sub-Agent Rules")) continue;

    const lines = block.trim().split("\n");
    const id = lines[0]?.trim().toLowerCase();
    if (!id || id.includes(" ")) continue;

    const get = (label: string): string => {
      const line = lines.find((l) => l.includes(`**${label}:**`));
      if (!line) return "";
      return line.split(`**${label}:**`)[1]?.trim().replace(/^"/, "").replace(/"$/, "") || "";
    };

    agents.push({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      role: get("Spawn for").split(",")[0] || id,
      description: get("Instructions"),
      model: get("Model"),
      tools: get("Tools").split(",").map((t) => t.trim()).filter(Boolean),
      spawnFor: get("Spawn for"),
      whenToUse: get("When to use"),
    });
  }
  return agents;
}

// Parse Scout's missions from its AGENTS.md
function parseScoutMissions(markdown: string): { label: string; cadence: string }[] {
  const missions: { label: string; cadence: string }[] = [];
  const missionRegex = /## Mission \d+:\s*(.+)/g;
  const cadenceRegex = /\*\*Cadence:\*\*\s*(.+)/g;

  let match;
  const labels: string[] = [];
  while ((match = missionRegex.exec(markdown)) !== null) {
    labels.push(match[1].trim());
  }
  const cadences: string[] = [];
  while ((match = cadenceRegex.exec(markdown)) !== null) {
    cadences.push(match[1].trim());
  }

  for (let i = 0; i < labels.length; i++) {
    missions.push({
      label: labels[i],
      cadence: cadences[i] || "Unknown",
    });
  }
  return missions;
}

function friendlyModel(modelStr: string): string {
  if (!modelStr) return "Unknown";
  // "kiro/claude-sonnet-4.6" → "Claude Sonnet 4.6"
  const parts = modelStr.split("/");
  const raw = parts[parts.length - 1];
  return raw
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function GET() {
  try {
    // Read openclaw.json for agent list and config
    const configRaw = await readFile(path.join(OPENCLAW_ROOT, "openclaw.json"), "utf-8");
    const config = JSON.parse(configRaw);

    const agentList: AgentConfig[] = config.agents?.list || [];
    const defaults = config.agents?.defaults || {};

    // Read workspace AGENTS.md for sub-agent definitions
    let smartyAgentsMd = "";
    try {
      smartyAgentsMd = await readFile(
        path.join(OPENCLAW_ROOT, "workspace", "AGENTS.md"),
        "utf-8"
      );
    } catch { /* no file */ }

    // Read workspace SOUL.md for identity
    let smartySoulMd = "";
    try {
      smartySoulMd = await readFile(
        path.join(OPENCLAW_ROOT, "workspace", "SOUL.md"),
        "utf-8"
      );
    } catch { /* no file */ }

    // Read Scout's AGENTS.md for missions
    let scoutAgentsMd = "";
    try {
      scoutAgentsMd = await readFile(
        path.join(OPENCLAW_ROOT, "workspace-research", "AGENTS.md"),
        "utf-8"
      );
    } catch { /* no file */ }

    // Read Scout's SOUL.md
    let scoutSoulMd = "";
    try {
      scoutSoulMd = await readFile(
        path.join(OPENCLAW_ROOT, "workspace-research", "SOUL.md"),
        "utf-8"
      );
    } catch { /* no file */ }

    // Build lead agents from config
    const leads = agentList.map((a) => {
      const primaryModel = a.model?.primary || defaults.model?.primary || "";
      const isScout = a.id === "scout";
      return {
        id: a.id,
        name: a.name || a.id,
        model: friendlyModel(primaryModel),
        workspace: a.workspace,
        tools: isScout ? (a.tools?.allow || []) : ["read", "write", "exec", "web", "browser", "sessions"],
        deniedTools: a.tools?.deny || [],
        isDefault: a.default || false,
      };
    });

    // Parse sub-agents from Smarty's AGENTS.md
    const subAgents = parseSubAgents(smartyAgentsMd).map((sa) => ({
      ...sa,
      model: friendlyModel(sa.model),
    }));

    // Parse Scout's missions
    const scoutMissions = parseScoutMissions(scoutAgentsMd);

    // Extract mission statement from SOUL.md if present
    // Look for career goal or mission-like statement
    let missionStatement = "";
    const missionMatch = smartySoulMd.match(/## Core Identity\s*\n\n(.+?)(?:\n\n|$)/s);
    if (missionMatch) {
      missionStatement = missionMatch[1].trim();
    }

    // Agent defaults
    const agentDefaults = {
      heartbeat: defaults.heartbeat?.every || "unknown",
      maxConcurrent: defaults.maxConcurrent || 0,
      subagentLimits: defaults.subagents || {},
    };

    return NextResponse.json({
      leads,
      subAgents,
      scoutMissions,
      missionStatement,
      agentDefaults,
    });
  } catch (err) {
    console.error("Failed to read team data:", err);
    return NextResponse.json({ leads: [], subAgents: [], scoutMissions: [], missionStatement: "", agentDefaults: {} });
  }
}
