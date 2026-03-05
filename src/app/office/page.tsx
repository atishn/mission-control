"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  emoji: string;
  color: string;
  status: "working" | "idle" | "offline" | "standup";
  currentTask?: string;
  deskPosition?: { x: number; y: number };
}

const AGENT_CONFIGS = [
  { id: "smarty", name: "Smarty", emoji: "💡", color: "var(--accent)" },
  { id: "scout", name: "Scout", emoji: "🔍", color: "var(--green)" },
  { id: "architect", name: "Architect", emoji: "🏗️", color: "var(--blue)" },
  { id: "developer", name: "Developer", emoji: "⚡", color: "var(--purple)" },
  { id: "tester", name: "Tester", emoji: "🧪", color: "var(--orange)" },
  { id: "designer", name: "Designer", emoji: "🎨", color: "var(--cyan)" },
  { id: "planner", name: "Planner", emoji: "📋", color: "var(--yellow)" },
  { id: "researcher", name: "Researcher", emoji: "📚", color: "var(--red)" },
];

// Desk positions in a grid layout
const DESK_POSITIONS = [
  { x: 150, y: 100 },
  { x: 300, y: 100 },
  { x: 450, y: 100 },
  { x: 600, y: 100 },
  { x: 150, y: 220 },
  { x: 300, y: 220 },
  { x: 450, y: 220 },
  { x: 600, y: 220 },
];

// Standup table position (bottom center)
const STANDUP_TABLE = { x: 375, y: 380 };

export default function OfficePage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgentStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      const agentsWithDesks = (data.agents || []).map((agent: Agent, i: number) => ({
        ...agent,
        // Agents stay at desk unless at standup
        deskPosition: agent.status !== "standup" ? DESK_POSITIONS[i % DESK_POSITIONS.length] : undefined,
      }));
      setAgents(agentsWithDesks);
    } catch {
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgentStatus();
    const interval = setInterval(fetchAgentStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchAgentStatus]);

  const atDeskAgents = agents.filter((a) => a.status !== "standup");
  const standupAgents = agents.filter((a) => a.status === "standup");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 size={20} className="animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Office
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          2D visualization of agent activity — {atDeskAgents.filter(a => a.status === "working").length} working, {atDeskAgents.filter(a => a.status === "idle").length} idle, {standupAgents.length} at standup
        </p>
      </div>

      {/* Office Canvas */}
      <div
        className="rounded-xl border relative overflow-hidden"
        style={{
          background: "var(--bg-secondary)",
          borderColor: "var(--border)",
          height: "500px",
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 800 500">
          {/* Grid floor pattern */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="var(--border)"
                strokeWidth="0.5"
                opacity="0.3"
              />
            </pattern>
          </defs>
          <rect width="800" height="500" fill="url(#grid)" />

          {/* Office furniture */}
          {/* Desks */}
          {DESK_POSITIONS.map((pos, i) => (
            <g key={`desk-${i}`}>
              {/* Desk */}
              <rect
                x={pos.x - 40}
                y={pos.y - 20}
                width="80"
                height="40"
                rx="4"
                fill="var(--bg-tertiary)"
                stroke="var(--border)"
                strokeWidth="2"
              />
              {/* Computer */}
              <rect
                x={pos.x - 15}
                y={pos.y - 10}
                width="30"
                height="20"
                rx="2"
                fill="var(--accent)"
                opacity="0.6"
              />
            </g>
          ))}

          {/* Standup table (center) */}
          <ellipse
            cx={STANDUP_TABLE.x}
            cy={STANDUP_TABLE.y}
            rx="80"
            ry="40"
            fill="var(--bg-tertiary)"
            stroke="var(--border)"
            strokeWidth="2"
          />
          <text
            x={STANDUP_TABLE.x}
            y={STANDUP_TABLE.y - 50}
            textAnchor="middle"
            fontSize="10"
            fill="var(--text-muted)"
          >
            Standup Table
          </text>

          {/* Plants (decoration) */}
          <g>
            <circle cx="50" cy="380" r="25" fill="var(--green)" opacity="0.3" />
            <text x="50" y="390" textAnchor="middle" fontSize="24">
              🌳
            </text>
          </g>
          <g>
            <circle cx="750" cy="380" r="25" fill="var(--green)" opacity="0.3" />
            <text x="750" y="390" textAnchor="middle" fontSize="24">
              🌳
            </text>
          </g>

          {/* Water cooler */}
          <g>
            <rect x="40" y="50" width="30" height="40" rx="4" fill="var(--blue)" opacity="0.4" />
            <text x="55" y="105" textAnchor="middle" fontSize="8" fill="var(--text-muted)">
              Water
            </text>
          </g>

          {/* Agents at desks (working or idle) */}
          {atDeskAgents.map((agent, i) => {
            const pos = agent.deskPosition || DESK_POSITIONS[i % DESK_POSITIONS.length];
            const statusColor = agent.status === "working" ? "#10b981" : "#6b7280";
            return (
              <g key={agent.id}>
                {/* Agent avatar */}
                <circle cx={pos.x} cy={pos.y + 40} r="20" fill={agent.color} opacity="0.2" />
                <text
                  x={pos.x}
                  y={pos.y + 50}
                  textAnchor="middle"
                  fontSize="24"
                  style={{ cursor: "pointer" }}
                >
                  {agent.emoji}
                </text>
                {/* Name label */}
                <text
                  x={pos.x}
                  y={pos.y + 75}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--text-primary)"
                  fontWeight="500"
                >
                  {agent.name}
                </text>
                {/* Status indicator - green for working, gray for idle/offline */}
                <circle cx={pos.x + 15} cy={pos.y + 35} r="4" fill={statusColor} />
              </g>
            );
          })}

          {/* Agents at standup table */}
          {standupAgents.map((agent, i) => {
            const angle = (i / standupAgents.length) * Math.PI * 2;
            const x = STANDUP_TABLE.x + Math.cos(angle) * 60;
            const y = STANDUP_TABLE.y + Math.sin(angle) * 30;
            return (
              <g key={agent.id}>
                <circle cx={x} cy={y} r="20" fill={agent.color} opacity="0.2" />
                <text x={x} y={y + 10} textAnchor="middle" fontSize="24" style={{ cursor: "pointer" }}>
                  {agent.emoji}
                </text>
                <text
                  x={x}
                  y={y + 30}
                  textAnchor="middle"
                  fontSize="9"
                  fill="var(--text-secondary)"
                  fontWeight="500"
                >
                  {agent.name}
                </text>
                {/* Standup indicator */}
                <circle cx={x + 12} cy={y - 5} r="3" fill="#eab308" />
              </g>
            );
          })}

          {/* Title at top */}
          <text
            x="400"
            y="30"
            textAnchor="middle"
            fontSize="14"
            fill="var(--text-primary)"
            fontWeight="600"
          >
            Build Council — Smarty&apos;s Squad
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center gap-6 text-xs" style={{ color: "var(--text-muted)" }}>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: "#10b981" }} />
          <span>Working</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: "#6b7280" }} />
          <span>Idle/Offline</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: "#eab308" }} />
          <span>At standup</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Updates every 5 seconds</span>
        </div>
      </div>

      {/* Agent status cards */}
      <div className="mt-8 grid grid-cols-4 gap-3">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="rounded-lg p-3 border"
            style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{agent.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                  {agent.name}
                </p>
                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  {agent.status === "standup" ? "Standup table" : "At desk"}
                </p>
              </div>
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ 
                  background: agent.status === "working" ? "#10b981" : 
                             agent.status === "standup" ? "#eab308" : 
                             "#6b7280" 
                }}
              />
            </div>
            {agent.currentTask && (
              <p className="text-[10px] truncate" style={{ color: "var(--text-secondary)" }}>
                {agent.currentTask}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
