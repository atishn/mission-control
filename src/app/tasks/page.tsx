"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Attachment {
  name: string;
  type: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  column: string;
  assignee: string | null;
  priority: "high" | "medium" | "low";
  status: "normal" | "blocked" | "waiting";
  feedback: string | null;
  movedToAtishAt: string | null;
  kept?: boolean;
  tags: string[];
  context: string;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

type FilterType = "all" | "active" | "review" | "done" | "waiting";

const COLUMNS = ["To Do", "In Progress", "QA", "Review", "Atish", "Done", "Archive"];

const COLUMN_COLORS: Record<string, string> = {
  "To Do": "var(--blue)",
  "In Progress": "var(--accent)",
  QA: "var(--yellow)",
  Review: "var(--orange)",
  Atish: "var(--purple)",
  Done: "var(--green)",
  Archive: "var(--text-muted)",
};

const ACTIVE_COLUMNS = ["To Do", "In Progress", "QA", "Review"];

const AGENTS = ["smarty", "developer", "tester", "designer", "planner", "researcher"];

const AGENT_COLORS: Record<string, string> = {
  smarty: "#6366f1",
  developer: "#3b82f6",
  tester: "#10b981",
  designer: "#f59e0b",
  planner: "#8b5cf6",
  researcher: "#ec4899",
};

const AGENT_LABELS: Record<string, string> = {
  smarty: "Smarty",
  developer: "Dev",
  tester: "Tester",
  designer: "Designer",
  planner: "Planner",
  researcher: "Research",
};

const AGENT_ROLES: Record<string, string> = {
  smarty: "Squad Lead",
  developer: "Engineer",
  tester: "QA Engineer",
  designer: "UX Designer",
  planner: "Project Manager",
  researcher: "Research Analyst",
};

const AGENT_ABOUT: Record<string, string> = {
  smarty: "Orchestrator and first point of contact. Delegates complex work, handles quick tasks directly, and owns outcomes.",
  developer: "Heads-down coder. Builds features, fixes bugs, and ships clean code with tests.",
  tester: "Quality gatekeeper. Validates builds with browser QA, catches edge cases, and ensures nothing ships broken.",
  designer: "UX-focused creative. Reviews usability, suggests improvements, and keeps interfaces clean and intuitive.",
  planner: "Big-picture thinker. Breaks down projects, tracks timelines, and keeps priorities aligned.",
  researcher: "Deep-dive specialist. Competitive analysis, market research, and surfacing actionable intel.",
};

const AGENT_SKILLS: Record<string, string[]> = {
  smarty: ["coordination", "delegation", "communication", "automation"],
  developer: ["typescript", "react", "next.js", "node.js", "tailwind"],
  tester: ["browser-qa", "e2e-testing", "edge-cases", "validation"],
  designer: ["ux-review", "accessibility", "layout", "usability"],
  planner: ["task-breakdown", "prioritization", "timelines", "roadmaps"],
  researcher: ["web-research", "analysis", "competitive-intel", "reporting"],
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "var(--red)",
  medium: "var(--yellow)",
  low: "var(--text-muted)",
};

const PRIORITY_BG: Record<string, string> = {
  high: "rgba(239,68,68,0.15)",
  medium: "rgba(234,179,8,0.15)",
  low: "rgba(148,163,184,0.15)",
};

const STATUS_ICONS: Record<string, string> = {
  normal: "",
  blocked: "⛔",
  waiting: "⏳",
};

const defaultForm = {
  title: "",
  description: "",
  column: "To Do",
  assignee: "",
  priority: "medium" as "high" | "medium" | "low",
  tags: "",
  context: "",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const agentPopoverRef = useRef<HTMLDivElement>(null);

  // Feedback modal state
  const [feedbackModal, setFeedbackModal] = useState<{ taskId: string; taskTitle: string } | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [viewFeedback, setViewFeedback] = useState<{ title: string; text: string } | null>(null);

  const loadTasks = useCallback(() => {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((data) => {
        setTasks(data.tasks || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Close agent popover on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (agentPopoverRef.current && !agentPopoverRef.current.contains(e.target as Node)) {
        setSelectedAgent(null);
      }
    }
    if (selectedAgent) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [selectedAgent]);

  // Close detail panel on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSelectedTask(null);
        setSelectedAgent(null);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  // Keep selectedTask in sync with tasks state
  useEffect(() => {
    if (selectedTask) {
      const updated = tasks.find((t) => t.id === selectedTask.id);
      if (updated) setSelectedTask(updated);
    }
  }, [tasks, selectedTask]);

  const filteredTasks = tasks.filter((t) => {
    switch (filter) {
      case "active": return ACTIVE_COLUMNS.includes(t.column);
      case "review": return t.column === "Review";
      case "done": return t.column === "Done";
      case "waiting": return t.status === "waiting" || t.status === "blocked";
      default: return true;
    }
  });

  const tasksInColumn = (col: string) => filteredTasks.filter((t) => t.column === col);
  const allTasksInColumn = (col: string) => tasks.filter((t) => t.column === col);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e: React.DragEvent, column: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    setDragOverCol(null);
    if (!taskId) return;
    const now = new Date().toISOString();
    const patch: Partial<Task> & { movedToAtishAt?: string | null } = { column };
    if (column === "Atish") patch.movedToAtishAt = now;
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...patch, updatedAt: now } : t)));
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  };

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const tagsArray = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          column: form.column,
          assignee: form.assignee || null,
          priority: form.priority,
          tags: tagsArray,
          context: form.context,
        }),
      });
      const data = await res.json();
      setTasks((prev) => [...prev, data.task]);
      setShowModal(false);
      setForm(defaultForm);
    } finally {
      setSaving(false);
    }
  };

  const handleAtishDelete = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTask?.id === taskId) setSelectedTask(null);
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
  };

  const handleAtishKeep = async (taskId: string) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, kept: true } : t)));
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kept: true }),
    });
  };

  const openFeedbackModal = (taskId: string, taskTitle: string) => {
    setFeedbackModal({ taskId, taskTitle });
    setFeedbackText("");
  };

  const handleSendBack = async () => {
    if (!feedbackModal) return;
    const { taskId } = feedbackModal;
    const now = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, column: "To Do", feedback: feedbackText, movedToAtishAt: null, kept: false, updatedAt: now }
          : t
      )
    );
    setFeedbackModal(null);
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ column: "To Do", feedback: feedbackText, movedToAtishAt: null, kept: false }),
    });
  };

  const agentCurrentTask = (agent: string) =>
    tasks.find((t) => t.assignee === agent && t.column === "In Progress");
  const agentIsActive = (agent: string) =>
    tasks.some((t) => t.assignee === agent && ACTIVE_COLUMNS.includes(t.column));

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "review", label: "Review" },
    { key: "done", label: "Done" },
    { key: "waiting", label: "Waiting" },
  ];


  return (
    <div className="flex gap-4 h-full relative" style={{ minHeight: 0 }}>
      {/* Agent Sidebar */}
      <div
        className="flex-shrink-0 rounded-xl p-3 flex flex-col gap-1"
        style={{ width: 160, background: "var(--bg-secondary)", border: "1px solid var(--border)", alignSelf: "flex-start" }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Squad</p>
        {AGENTS.map((agent) => {
          const active = agentIsActive(agent);
          const current = agentCurrentTask(agent);
          const isSelected = selectedAgent === agent;
          return (
            <div key={agent} className="relative">
              <div
                onClick={() => setSelectedAgent(isSelected ? null : agent)}
                className="flex flex-col gap-0.5 py-1.5 px-2 rounded-lg cursor-pointer transition-colors"
                style={{ background: isSelected ? "var(--bg-hover)" : "var(--bg-tertiary)", border: isSelected ? "1px solid var(--border)" : "1px solid transparent" }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ background: AGENT_COLORS[agent] }}>
                    {agent[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium truncate" style={{ color: "var(--text-primary)" }}>{AGENT_LABELS[agent]}</p>
                    <p className="text-[9px] truncate" style={{ color: "var(--text-muted)" }}>{AGENT_ROLES[agent]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 pl-8">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: active ? "var(--green)" : "var(--text-muted)" }} />
                  <span className="text-[9px] font-medium" style={{ color: active ? "var(--green)" : "var(--text-muted)" }}>
                    {active ? "WORKING" : "IDLE"}
                  </span>
                </div>
                {current && <p className="text-[9px] truncate pl-8" style={{ color: "var(--text-muted)" }}>{current.title}</p>}
              </div>
              {isSelected && (
                <div ref={agentPopoverRef} className="absolute left-full top-0 ml-2 z-50 rounded-xl p-3 shadow-xl" style={{ width: 220, background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: AGENT_COLORS[agent] }}>{agent[0].toUpperCase()}</div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{AGENT_LABELS[agent]}</p>
                      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{AGENT_ROLES[agent]}</p>
                    </div>
                  </div>
                  <p className="text-[10px] leading-relaxed mb-2" style={{ color: "var(--text-secondary)" }}>{AGENT_ABOUT[agent]}</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {AGENT_SKILLS[agent].map((skill) => (
                      <span key={skill} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>{skill}</span>
                    ))}
                  </div>
                  {current && (
                    <div className="pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                      <p className="text-[9px] font-medium mb-0.5" style={{ color: "var(--text-muted)" }}>CURRENT TASK</p>
                      <p className="text-[10px]" style={{ color: "var(--text-primary)" }}>{current.title}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Task Board</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{tasks.length} tasks across {COLUMNS.length} columns</p>
          </div>
          <button onClick={() => setShowModal(true)} className="px-3 py-1.5 rounded-md text-xs font-medium" style={{ background: "var(--accent)", color: "white" }}>+ New Task</button>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {FILTERS.map(({ key, label }) => {
            const count = key === "all" ? tasks.length : key === "active" ? tasks.filter((t) => ACTIVE_COLUMNS.includes(t.column)).length : key === "review" ? tasks.filter((t) => t.column === "Review").length : key === "done" ? tasks.filter((t) => t.column === "Done").length : tasks.filter((t) => t.status === "waiting" || t.status === "blocked").length;
            const isActive = filter === key;
            return (
              <button key={key} onClick={() => setFilter(key)} className="px-3 py-1 rounded-full text-xs font-medium transition-colors" style={{ background: isActive ? "var(--accent)" : "var(--bg-secondary)", color: isActive ? "white" : "var(--text-secondary)", border: `1px solid ${isActive ? "var(--accent)" : "var(--border)"}` }}>
                {label}<span className="ml-1.5 text-[10px]" style={{ opacity: isActive ? 0.8 : 0.6 }}>{count}</span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading tasks...</p>
        ) : (
          <div className="overflow-x-auto pb-4 flex-1">
            <div className="flex gap-3" style={{ minWidth: "max-content" }}>
              {COLUMNS.map((col) => {
                const colTasks = tasksInColumn(col);
                const totalCount = allTasksInColumn(col).length;
                const isOver = dragOverCol === col;
                const isAtish = col === "Atish";
                return (
                  <div key={col} onDragOver={(e) => { e.preventDefault(); setDragOverCol(col); }} onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverCol(null); }} onDrop={(e) => handleDrop(e, col)} className="rounded-xl p-2 transition-colors flex flex-col" style={{ width: isAtish ? 220 : 190, minHeight: 120, background: isOver ? "var(--bg-tertiary)" : isAtish ? "rgba(168,85,247,0.05)" : "var(--bg-secondary)", border: isOver ? "1px dashed var(--accent)" : isAtish ? "1px solid rgba(168,85,247,0.3)" : "1px solid var(--border)" }}>
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLUMN_COLORS[col] }} />
                      <span className="text-xs font-semibold truncate" style={{ color: isAtish ? "var(--purple)" : "var(--text-secondary)" }}>{col}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full ml-auto flex-shrink-0 font-medium" style={{ background: isAtish ? "rgba(168,85,247,0.15)" : "var(--bg-tertiary)", color: isAtish ? "var(--purple)" : "var(--text-muted)" }}>{totalCount}</span>
                    </div>
                    <div className="space-y-2 flex-1">
                      {colTasks.map((task) => (
                        <div key={task.id} draggable={!isAtish} onDragStart={(e) => !isAtish && handleDragStart(e, task.id)} onClick={() => setSelectedTask(task)} className="rounded-lg p-3 border select-none transition-colors" style={{ background: "var(--bg-tertiary)", borderColor: task.kept ? "rgba(34,197,94,0.4)" : task.status === "blocked" ? "rgba(239,68,68,0.3)" : task.status === "waiting" ? "rgba(234,179,8,0.3)" : "var(--border)", cursor: isAtish ? "pointer" : "grab" }}>
                          {task.feedback && task.column !== "Atish" && (
                            <div onClick={(e) => { e.stopPropagation(); setViewFeedback({ title: task.title, text: task.feedback! }); }} className="text-[9px] px-2 py-1 rounded mb-2 leading-relaxed cursor-pointer" style={{ background: "rgba(234,179,8,0.1)", color: "var(--yellow)", border: "1px solid rgba(234,179,8,0.2)" }} title="Click to view full feedback">💬 {task.feedback}</div>
                          )}
                          <p className="text-xs mb-1.5 leading-relaxed" style={{ color: "var(--text-primary)" }}>{task.title}</p>
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-1.5">
                              {task.tags.slice(0, 2).map((tag) => (<span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--bg-secondary)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>{tag}</span>))}
                              {task.tags.length > 2 && <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>+{task.tags.length - 2}</span>}
                            </div>
                          )}
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5">
                              {task.assignee ? (<div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0" style={{ background: AGENT_COLORS[task.assignee] || "var(--bg-hover)" }} title={task.assignee}>{task.assignee[0].toUpperCase()}</div>) : (<div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px]" style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}>—</div>)}
                              {task.status !== "normal" && <span className="text-[10px]" title={task.status}>{STATUS_ICONS[task.status]}</span>}
                              {task.kept && <span className="text-[9px] px-1 rounded" style={{ background: "rgba(34,197,94,0.15)", color: "var(--green)" }}>kept</span>}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>{timeAgo(task.updatedAt)}</span>
                              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: PRIORITY_COLORS[task.priority] }} title={task.priority} />
                            </div>
                          </div>
                          {isAtish && !task.kept && (
                            <div className="flex gap-1 mt-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                              <button onClick={(e) => { e.stopPropagation(); handleAtishKeep(task.id); }} className="flex-1 py-1 rounded text-[10px] font-medium" style={{ background: "rgba(34,197,94,0.15)", color: "var(--green)" }}>Keep</button>
                              <button onClick={(e) => { e.stopPropagation(); openFeedbackModal(task.id, task.title); }} className="flex-1 py-1 rounded text-[10px] font-medium" style={{ background: "rgba(59,130,246,0.15)", color: "var(--blue)" }}>Redo</button>
                              <button onClick={(e) => { e.stopPropagation(); handleAtishDelete(task.id); }} className="flex-1 py-1 rounded text-[10px] font-medium" style={{ background: "rgba(239,68,68,0.15)", color: "var(--red)" }}>Delete</button>
                            </div>
                          )}
                          {isAtish && task.kept && (
                            <div className="flex gap-1 mt-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                              <button onClick={(e) => { e.stopPropagation(); handleAtishDelete(task.id); }} className="w-full py-1 rounded text-[10px] font-medium" style={{ background: "rgba(239,68,68,0.1)", color: "var(--text-muted)" }}>Archive</button>
                            </div>
                          )}
                        </div>
                      ))}
                      {colTasks.length === 0 && (
                        <div className="text-[10px] text-center py-4 rounded-lg" style={{ color: "var(--text-muted)", border: "1px dashed var(--border)" }}>
                          {isAtish ? "Drop tasks here for review" : "Empty"}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Task Detail Panel */}
      {selectedTask && (
        <>
          <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setSelectedTask(null)} />
          <div className="fixed right-0 top-0 bottom-0 z-50 overflow-y-auto" style={{ width: 400, background: "var(--bg-primary)", borderLeft: "1px solid var(--border)" }}>
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-base font-semibold leading-snug pr-4" style={{ color: "var(--text-primary)" }}>{selectedTask.title}</h2>
                <button onClick={() => setSelectedTask(null)} className="text-sm flex-shrink-0 w-6 h-6 rounded flex items-center justify-center" style={{ color: "var(--text-muted)", background: "var(--bg-tertiary)" }}>✕</button>
              </div>

              {/* Status badges */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${COLUMN_COLORS[selectedTask.column]}22`, color: COLUMN_COLORS[selectedTask.column], border: `1px solid ${COLUMN_COLORS[selectedTask.column]}44` }}>{selectedTask.column.toUpperCase()}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: PRIORITY_BG[selectedTask.priority], color: PRIORITY_COLORS[selectedTask.priority] }}>{selectedTask.priority.toUpperCase()}</span>
                {selectedTask.status !== "normal" && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)" }}>{STATUS_ICONS[selectedTask.status]} {selectedTask.status.toUpperCase()}</span>}
                {selectedTask.kept && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.15)", color: "var(--green)" }}>KEPT</span>}
              </div>

              {/* Tags */}
              {selectedTask.tags && selectedTask.tags.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedTask.tags.map((tag) => (<span key={tag} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>{tag}</span>))}
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedTask.description && (
                <div className="mb-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>Description</p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{selectedTask.description}</p>
                </div>
              )}

              {/* Context */}
              {selectedTask.context && (
                <div className="mb-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>Context</p>
                  <div className="text-[11px] p-3 rounded-lg leading-relaxed" style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)", fontFamily: "monospace", border: "1px solid var(--border)" }}>{selectedTask.context}</div>
                </div>
              )}

              {/* Feedback */}
              {selectedTask.feedback && (
                <div className="mb-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>Feedback</p>
                  <div className="text-xs p-3 rounded-lg leading-relaxed" style={{ background: "rgba(234,179,8,0.08)", color: "var(--yellow)", border: "1px solid rgba(234,179,8,0.2)" }}>{selectedTask.feedback}</div>
                </div>
              )}

              {/* Assignee */}
              <div className="mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>Assignee</p>
                {selectedTask.assignee ? (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ background: AGENT_COLORS[selectedTask.assignee] }}>{selectedTask.assignee[0].toUpperCase()}</div>
                    <div>
                      <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{AGENT_LABELS[selectedTask.assignee] || selectedTask.assignee}</p>
                      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{AGENT_ROLES[selectedTask.assignee] || "Agent"}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Unassigned</p>
                )}
              </div>

              {/* Timeline */}
              <div className="mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>Timeline</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]"><span style={{ color: "var(--text-muted)" }}>Created</span><span style={{ color: "var(--text-secondary)" }}>{formatDate(selectedTask.createdAt)}</span></div>
                  <div className="flex justify-between text-[11px]"><span style={{ color: "var(--text-muted)" }}>Updated</span><span style={{ color: "var(--text-secondary)" }}>{timeAgo(selectedTask.updatedAt)}</span></div>
                </div>
              </div>

              {/* Attachments */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>Attachments</p>
                {selectedTask.attachments && selectedTask.attachments.length > 0 ? (
                  <div className="space-y-1">
                    {selectedTask.attachments.map((a, i) => (<div key={i} className="text-[11px] px-2 py-1 rounded" style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>📎 {a.name}</div>))}
                  </div>
                ) : (
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>No attachments</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* New Task Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.6)" }} onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="rounded-xl p-6 w-full max-w-md mx-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>New Task</h2>
            <div className="space-y-3">
              <input autoFocus type="text" placeholder="Task title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }} className="w-full px-3 py-2 rounded-md text-xs outline-none" style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border)" }} />
              <textarea placeholder="Description (optional)" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-md text-xs outline-none resize-none" style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border)" }} />
              <input type="text" placeholder="Tags (comma-separated)" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} className="w-full px-3 py-2 rounded-md text-xs outline-none" style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border)" }} />
              <textarea placeholder="Context notes (optional)" value={form.context} onChange={(e) => setForm((f) => ({ ...f, context: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-md text-xs outline-none resize-none" style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border)" }} />
              <div className="grid grid-cols-3 gap-2">
                <select value={form.column} onChange={(e) => setForm((f) => ({ ...f, column: e.target.value }))} className="px-2 py-2 rounded-md text-xs outline-none" style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
                  {COLUMNS.filter((c) => c !== "Atish" && c !== "Archive").map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={form.assignee} onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))} className="px-2 py-2 rounded-md text-xs outline-none" style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
                  <option value="">Unassigned</option>
                  {AGENTS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as "high" | "medium" | "low" }))} className="px-2 py-2 rounded-md text-xs outline-none" style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleCreate} disabled={saving || !form.title.trim()} className="flex-1 py-2 rounded-md text-xs font-medium disabled:opacity-50" style={{ background: "var(--accent)", color: "white" }}>{saving ? "Creating..." : "Create Task"}</button>
              <button onClick={() => { setShowModal(false); setForm(defaultForm); }} className="px-4 py-2 rounded-md text-xs" style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* View Feedback Modal */}
      {viewFeedback && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.6)" }} onClick={(e) => { if (e.target === e.currentTarget) setViewFeedback(null); }}>
          <div className="rounded-xl p-6 w-full max-w-sm mx-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Feedback</h2>
            <p className="text-xs mb-4 truncate" style={{ color: "var(--text-muted)" }}>{viewFeedback.title}</p>
            <div className="text-xs p-3 rounded-lg mb-4 leading-relaxed" style={{ background: "rgba(234,179,8,0.08)", color: "var(--yellow)", border: "1px solid rgba(234,179,8,0.2)" }}>{viewFeedback.text}</div>
            <button onClick={() => setViewFeedback(null)} className="w-full py-2 rounded-md text-xs font-medium" style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>Close</button>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.6)" }} onClick={(e) => { if (e.target === e.currentTarget) setFeedbackModal(null); }}>
          <div className="rounded-xl p-6 w-full max-w-sm mx-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Send back to To Do</h2>
            <p className="text-xs mb-4 truncate" style={{ color: "var(--text-muted)" }}>{feedbackModal.taskTitle}</p>
            <textarea autoFocus placeholder="What needs to be done differently? (optional)" value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-md text-xs outline-none resize-none mb-4" style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border)" }} />
            <div className="flex gap-2">
              <button onClick={handleSendBack} className="flex-1 py-2 rounded-md text-xs font-medium" style={{ background: "var(--blue)", color: "white" }}>Send Back</button>
              <button onClick={() => setFeedbackModal(null)} className="px-4 py-2 rounded-md text-xs" style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
