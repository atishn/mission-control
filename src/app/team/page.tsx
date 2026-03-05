"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronRight, Shield, Loader2 } from "lucide-react";

/* ── Types ── */

interface LeadAgent {
  id: string;
  name: string;
  model: string;
  workspace: string;
  tools: string[];
  deniedTools: string[];
  isDefault: boolean;
}

interface SubAgent {
  id: string;
  name: string;
  role: string;
  description: string;
  model: string;
  tools: string[];
  spawnFor: string;
  whenToUse: string;
}

interface ScoutMission {
  label: string;
  cadence: string;
}

interface TeamData {
  leads: LeadAgent[];
  subAgents: SubAgent[];
  scoutMissions: ScoutMission[];
  missionStatement: string;
  agentDefaults: {
    heartbeat?: string;
    maxConcurrent?: number;
    subagentLimits?: { maxSpawnDepth?: number; maxChildrenPerAgent?: number; maxConcurrent?: number };
  };
}

/* ── Emoji map for sub-agents ── */
const EMOJI_MAP: Record<string, string> = {
  architect: "🏗️",
  developer: "⚡",
  tester: "🧪",
  designer: "🎨",
  planner: "📋",
  researcher: "📚",
};

const LEAD_EMOJI: Record<string, string> = {
  smarty: "💡",
  scout: "🔍",
};

/* ── Role labels for sub-agents ── */
const ROLE_LABELS: Record<string, string> = {
  architect: "System Designer",
  developer: "Lead Engineer",
  tester: "QA & Validation",
  designer: "UX & Graphics",
  planner: "Project Planning",
  researcher: "Deep Research",
};

/* ── Tag colors ── */
const TAG_COLORS = [
  "var(--accent)", "var(--blue)", "var(--green)", "var(--purple)",
  "var(--orange)", "var(--cyan)", "var(--yellow)", "var(--red)",
];

function getTagColor(i: number): string {
  return TAG_COLORS[i % TAG_COLORS.length];
}

/* ── Mission colors ── */
const MISSION_COLORS = ["var(--blue)", "var(--green)", "var(--orange)", "var(--purple)", "var(--cyan)"];

const FALLBACK_MISSION =
  "Build an autonomous organization of AI agents that produce value 24/7 — across Martech, AI, Sports Betting, and eCommerce.";

/* ── Detail modal state ── */
type DetailItem =
  | { kind: "lead"; agent: LeadAgent }
  | { kind: "sub"; agent: SubAgent }
  | null;

export default function TeamPage() {
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DetailItem>(null);

  const fetchTeam = useCallback(async () => {
    try {
      const res = await fetch("/api/team");
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 size={20} className="animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    );
  }

  if (!data || data.leads.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
          Could not load team data from openclaw.json
        </span>
      </div>
    );
  }

  const smarty = data.leads.find((a) => a.isDefault || a.id === "smarty" || a.id === "main");
  const scout = data.leads.find((a) => a.id === "scout");
  const otherLeads = data.leads.filter((a) => a !== smarty && a !== scout);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Mission Statement */}
      <div
        className="rounded-xl p-5 border mb-10 relative overflow-hidden"
        style={{ background: "var(--bg-secondary)", borderColor: "var(--accent)" }}
      >
        <div
          className="absolute inset-0 opacity-5"
          style={{ background: "radial-gradient(ellipse at center, var(--accent), transparent 70%)" }}
        />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={14} style={{ color: "var(--accent)" }} />
            <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "var(--accent)" }}>
              Mission Statement
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
            {data.missionStatement || FALLBACK_MISSION}
          </p>
          {data.agentDefaults.heartbeat && (
            <div className="flex gap-4 mt-3">
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                Heartbeat: {data.agentDefaults.heartbeat}
              </span>
              {data.agentDefaults.maxConcurrent && (
                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  Max concurrent: {data.agentDefaults.maxConcurrent}
                </span>
              )}
              {data.agentDefaults.subagentLimits?.maxConcurrent && (
                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  Max sub-agents: {data.agentDefaults.subagentLimits.maxConcurrent}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══ SMARTY SECTION ═══ */}
      {smarty && (
        <div className="mb-12">
          <LeadAgentCard
            agent={smarty}
            emoji={LEAD_EMOJI[smarty.id] || "🤖"}
            onSelect={() => setSelected({ kind: "lead", agent: smarty })}
          />

          {data.subAgents.length > 0 && (
            <>
              <div className="flex justify-center">
                <div className="w-px h-6" style={{ background: "var(--border)" }} />
              </div>
              <div className="flex items-center gap-3 mb-4 px-2">
                <div className="h-px flex-1" style={{ background: "var(--border)" }} />
                <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                  {smarty.name.split(" ")[0]}&apos;s Sub-Agents &middot; Spawned on demand
                </span>
                <div className="h-px flex-1" style={{ background: "var(--border)" }} />
              </div>

              <div
                className="rounded-xl border p-4"
                style={{
                  background: "color-mix(in srgb, var(--accent) 3%, var(--bg-primary))",
                  borderColor: "var(--border)",
                }}
              >
                <div className="grid grid-cols-3 gap-3">
                  {data.subAgents.map((sa) => (
                    <SubAgentCard
                      key={sa.id}
                      agent={sa}
                      onSelect={() => setSelected({ kind: "sub", agent: sa })}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══ SCOUT SECTION ═══ */}
      {scout && (
        <div className="mb-12">
          <LeadAgentCard
            agent={scout}
            emoji={LEAD_EMOJI[scout.id] || "🤖"}
            onSelect={() => setSelected({ kind: "lead", agent: scout })}
          />

          {data.scoutMissions.length > 0 && (
            <>
              <div className="flex justify-center">
                <div className="w-px h-6" style={{ background: "var(--border)" }} />
              </div>
              <div className="flex items-center gap-3 mb-4 px-2">
                <div className="h-px flex-1" style={{ background: "var(--border)" }} />
                <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                  {scout.name.split(" ")[0]}&apos;s Missions &middot; No sub-agents (read-only)
                </span>
                <div className="h-px flex-1" style={{ background: "var(--border)" }} />
              </div>

              <div
                className="rounded-xl border p-4"
                style={{
                  background: "color-mix(in srgb, var(--green) 3%, var(--bg-primary))",
                  borderColor: "var(--border)",
                }}
              >
                <div className="grid grid-cols-3 gap-3">
                  {data.scoutMissions.map((m, i) => (
                    <div
                      key={m.label}
                      className="rounded-lg p-3 border"
                      style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ background: MISSION_COLORS[i] }} />
                        <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                          {m.label}
                        </span>
                      </div>
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{m.cadence}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══ OTHER AGENTS (if any) ═══ */}
      {otherLeads.map((agent) => (
        <div key={agent.id} className="mb-8">
          <LeadAgentCard
            agent={agent}
            emoji="🤖"
            onSelect={() => setSelected({ kind: "lead", agent })}
          />
        </div>
      ))}

      {/* ═══ DETAIL MODAL ═══ */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl p-6 border max-h-[80vh] overflow-y-auto"
            style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {selected.kind === "lead" ? (
              <LeadDetail agent={selected.agent} onClose={() => setSelected(null)} />
            ) : (
              <SubDetail agent={selected.agent} onClose={() => setSelected(null)} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Lead Agent Card ── */

function LeadAgentCard({
  agent,
  emoji,
  onSelect,
}: {
  agent: LeadAgent;
  emoji: string;
  onSelect: () => void;
}) {
  return (
    <div
      className="rounded-xl border p-5 cursor-pointer transition-all"
      style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
      onClick={onSelect}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: "var(--bg-tertiary)" }}
        >
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              {agent.name}
            </span>
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: "color-mix(in srgb, var(--green) 15%, transparent)", color: "var(--green)" }}
            >
              online
            </span>
            {agent.isDefault && (
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full"
                style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)" }}
              >
                default
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {agent.tools.map((tool, i) => (
              <span
                key={tool}
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{
                  background: `color-mix(in srgb, ${getTagColor(i)} 20%, transparent)`,
                  color: getTagColor(i),
                }}
              >
                {tool}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{agent.model}</span>
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>&middot;</span>
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              {agent.workspace.split("/").pop()}
            </span>
            <span
              className="text-[10px] ml-auto flex items-center gap-1"
              style={{ color: "var(--text-muted)" }}
            >
              ROLE CARD <ChevronRight size={10} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-Agent Card ── */

function SubAgentCard({ agent, onSelect }: { agent: SubAgent; onSelect: () => void }) {
  const emoji = EMOJI_MAP[agent.id] || "🤖";
  const roleLabel = ROLE_LABELS[agent.id] || agent.role;

  return (
    <div
      className="rounded-lg border p-3 cursor-pointer transition-all hover:border-opacity-60"
      style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
          style={{ background: "var(--bg-tertiary)" }}
        >
          {emoji}
        </div>
        <div className="min-w-0">
          <span className="text-xs font-semibold block" style={{ color: "var(--text-primary)" }}>
            {agent.name}
          </span>
          <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>{roleLabel}</span>
        </div>
      </div>
      <p className="text-[11px] leading-relaxed mb-2" style={{ color: "var(--text-muted)" }}>
        {agent.spawnFor.length > 90 ? agent.spawnFor.slice(0, 90) + "..." : agent.spawnFor}
      </p>
      <div className="flex flex-wrap gap-1 mb-2">
        {agent.tools.map((tool, i) => (
          <span
            key={tool}
            className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
            style={{
              background: `color-mix(in srgb, ${getTagColor(i)} 20%, transparent)`,
              color: getTagColor(i),
            }}
          >
            {tool}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>{agent.model}</span>
        <div className="flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
          <span className="text-[9px]">ROLE CARD</span>
          <ChevronRight size={9} />
        </div>
      </div>
    </div>
  );
}

/* ── Detail Views ── */

function LeadDetail({ agent, onClose }: { agent: LeadAgent; onClose: () => void }) {
  const emoji = LEAD_EMOJI[agent.id] || "🤖";
  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: "var(--bg-tertiary)" }}>
            {emoji}
          </div>
          <div>
            <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{agent.name}</h2>
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {agent.isDefault ? "Primary Agent" : "Persistent Agent"}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="text-xs px-2 py-1 rounded" style={{ color: "var(--text-muted)" }}>✕</button>
      </div>
      <div className="space-y-3">
        <InfoBlock label="Model" value={agent.model} />
        <InfoBlock label="Workspace" value={agent.workspace} />
        <InfoBlock label="Tools (allowed)" value={agent.tools.join(", ") || "all"} />
        {agent.deniedTools.length > 0 && (
          <InfoBlock label="Tools (denied)" value={agent.deniedTools.join(", ")} />
        )}
        <InfoBlock label="Default Agent" value={agent.isDefault ? "Yes — receives all unrouted messages" : "No"} />
      </div>
    </>
  );
}

function SubDetail({ agent, onClose }: { agent: SubAgent; onClose: () => void }) {
  const emoji = EMOJI_MAP[agent.id] || "🤖";
  const roleLabel = ROLE_LABELS[agent.id] || agent.role;
  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: "var(--bg-tertiary)" }}>
            {emoji}
          </div>
          <div>
            <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{agent.name}</h2>
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {roleLabel} &middot; reports to Smarty
            </span>
          </div>
        </div>
        <button onClick={onClose} className="text-xs px-2 py-1 rounded" style={{ color: "var(--text-muted)" }}>✕</button>
      </div>
      <div className="space-y-3">
        <InfoBlock label="Model" value={agent.model} />
        <InfoBlock label="Tools" value={agent.tools.join(", ")} />
        <InfoBlock label="Spawn For" value={agent.spawnFor} />
        <InfoBlock label="When to Use" value={agent.whenToUse} />
        {agent.description && (
          <div>
            <span className="text-[11px] font-medium block mb-1" style={{ color: "var(--text-secondary)" }}>Instructions</span>
            <div className="rounded-md p-3 text-xs leading-relaxed" style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}>
              {agent.description}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[11px] font-medium block mb-0.5" style={{ color: "var(--text-secondary)" }}>{label}</span>
      <span className="text-xs" style={{ color: "var(--text-primary)" }}>{value}</span>
    </div>
  );
}
