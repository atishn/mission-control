"use client";

import { useState, useEffect, useCallback } from "react";

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

const PRIORITY_COLORS: Record<string, string> = {
  high: "var(--red)",
  medium: "var(--yellow)",
  low: "var(--text-muted)",
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

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

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

  // Client-side filtering
  const filteredTasks = tasks.filter((t) => {
    switch (filter) {
      case "active": return ACTIVE_COLUMNS.includes(t.column);
      case "review": return t.column === "Review";
      case "done": return t.column === "Done";
      case "waiting": return t.status === "waiting" || t.status === "blocked";
      default: return true;
    }
  });

  const tasksInColumn = (col: string) =>
    filteredTasks.filter((t) => t.column === col);

  // All tasks in column (for count badge — always show real count)
  const allTasksInColumn = (col: string) =>
    tasks.filter((t) => t.column === col);

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

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...patch, updatedAt: now } : t))
    );

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
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, assignee: form.assignee || null }),
      });
      const data = await res.json();
      setTasks((prev) => [...prev, data.task]);
      setShowModal(false);
      setForm(defaultForm);
    } finally {
      setSaving(false);
    }
  };

  // Atish column actions
  const handleAtishDelete = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
  };

  const handleAtishKeep = async (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, kept: true } : t))
    );
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

  // Agent sidebar: derive current work
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
    <div className="flex gap-4 h-full" style={{ minHeight: 0 }}>
      {/* Agent Sidebar */}
      <div
        className="flex-shrink-0 rounded-xl p-3 flex flex-col gap-1"
        style={{
          width: 160,
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          alignSelf: "flex-start",
        }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
          Squad
        </p>
        {AGENTS.map((agent) => {
          const active = agentIsActive(agent);
          const current = agentCurrentTask(agent);
          return (
            <div key={agent} className="flex flex-col gap-0.5 py-1.5 px-2 rounded-lg" style={{ background: "var(--bg-tertiary)" }}>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{ background: AGENT_COLORS[agent] }}
                >
                  {agent[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {AGENT_LABELS[agent]}
                  </p>
                </div>
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: active ? "var(--green)" : "var(--text-muted)" }}
                  title={active ? "Active" : "Idle"}
                />
              </div>
              {current && (
                <p className="text-[9px] truncate pl-8" style={{ color: "var(--text-muted)" }}>
                  {current.title}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
              Task Board
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
              {tasks.length} tasks across {COLUMNS.length} columns
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-1.5 rounded-md text-xs font-medium"
            style={{ background: "var(--accent)", color: "white" }}
          >
            + New Task
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {FILTERS.map(({ key, label }) => {
            const count =
              key === "all" ? tasks.length
              : key === "active" ? tasks.filter((t) => ACTIVE_COLUMNS.includes(t.column)).length
              : key === "review" ? tasks.filter((t) => t.column === "Review").length
              : key === "done" ? tasks.filter((t) => t.column === "Done").length
              : tasks.filter((t) => t.status === "waiting" || t.status === "blocked").length;
            const active = filter === key;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                style={{
                  background: active ? "var(--accent)" : "var(--bg-secondary)",
                  color: active ? "white" : "var(--text-secondary)",
                  border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                }}
              >
                {label}
                <span
                  className="ml-1.5 text-[10px]"
                  style={{ opacity: active ? 0.8 : 0.6 }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Board */}
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
                  <div
                    key={col}
                    onDragOver={(e) => { e.preventDefault(); setDragOverCol(col); }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setDragOverCol(null);
                      }
                    }}
                    onDrop={(e) => handleDrop(e, col)}
                    className="rounded-xl p-2 transition-colors flex flex-col"
                    style={{
                      width: isAtish ? 220 : 190,
                      minHeight: 120,
                      background: isOver
                        ? "var(--bg-tertiary)"
                        : isAtish
                        ? "rgba(168,85,247,0.05)"
                        : "var(--bg-secondary)",
                      border: isOver
                        ? "1px dashed var(--accent)"
                        : isAtish
                        ? "1px solid rgba(168,85,247,0.3)"
                        : "1px solid var(--border)",
                    }}
                  >
                    {/* Column header */}
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: COLUMN_COLORS[col] }}
                      />
                      <span
                        className="text-xs font-semibold truncate"
                        style={{ color: isAtish ? "var(--purple)" : "var(--text-secondary)" }}
                      >
                        {col}
                      </span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full ml-auto flex-shrink-0 font-medium"
                        style={{
                          background: isAtish ? "rgba(168,85,247,0.15)" : "var(--bg-tertiary)",
                          color: isAtish ? "var(--purple)" : "var(--text-muted)",
                        }}
                      >
                        {totalCount}
                      </span>
                    </div>

                    {/* Task cards */}
                    <div className="space-y-2 flex-1">
                      {colTasks.map((task) => (
                        <div
                          key={task.id}
                          draggable={!isAtish}
                          onDragStart={(e) => !isAtish && handleDragStart(e, task.id)}
                          className="rounded-lg p-3 border select-none"
                          style={{
                            background: "var(--bg-tertiary)",
                            borderColor: task.kept
                              ? "rgba(34,197,94,0.4)"
                              : task.status === "blocked"
                              ? "rgba(239,68,68,0.3)"
                              : task.status === "waiting"
                              ? "rgba(234,179,8,0.3)"
                              : "var(--border)",
                            cursor: isAtish ? "default" : "grab",
                          }}
                        >
                          {/* Feedback banner */}
                          {task.feedback && task.column !== "Atish" && (
                            <div
                              onClick={() => setViewFeedback({ title: task.title, text: task.feedback! })}
                              className="text-[9px] px-2 py-1 rounded mb-2 leading-relaxed cursor-pointer"
                              style={{
                                background: "rgba(234,179,8,0.1)",
                                color: "var(--yellow)",
                                border: "1px solid rgba(234,179,8,0.2)",
                              }}
                              title="Click to view full feedback"
                            >
                              💬 {task.feedback}
                            </div>
                          )}

                          {/* Title */}
                          <p className="text-xs mb-2 leading-relaxed" style={{ color: "var(--text-primary)" }}>
                            {task.title}
                          </p>

                          {/* Meta row */}
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5">
                              {task.assignee ? (
                                <div
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                                  style={{ background: AGENT_COLORS[task.assignee] || "var(--bg-hover)" }}
                                  title={task.assignee}
                                >
                                  {task.assignee[0].toUpperCase()}
                                </div>
                              ) : (
                                <div
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-[9px]"
                                  style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}
                                >
                                  —
                                </div>
                              )}
                              {task.status !== "normal" && (
                                <span className="text-[10px]" title={task.status}>
                                  {STATUS_ICONS[task.status]}
                                </span>
                              )}
                              {task.kept && (
                                <span className="text-[9px] px-1 rounded" style={{ background: "rgba(34,197,94,0.15)", color: "var(--green)" }}>
                                  kept
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>
                                {timeAgo(task.updatedAt)}
                              </span>
                              <div
                                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                style={{ background: PRIORITY_COLORS[task.priority] }}
                                title={task.priority}
                              />
                            </div>
                          </div>

                          {/* Atish actions */}
                          {isAtish && !task.kept && (
                            <div className="flex gap-1 mt-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                              <button
                                onClick={() => handleAtishKeep(task.id)}
                                className="flex-1 py-1 rounded text-[10px] font-medium transition-colors"
                                style={{ background: "rgba(34,197,94,0.15)", color: "var(--green)" }}
                              >
                                Keep
                              </button>
                              <button
                                onClick={() => openFeedbackModal(task.id, task.title)}
                                className="flex-1 py-1 rounded text-[10px] font-medium transition-colors"
                                style={{ background: "rgba(59,130,246,0.15)", color: "var(--blue)" }}
                              >
                                Redo
                              </button>
                              <button
                                onClick={() => handleAtishDelete(task.id)}
                                className="flex-1 py-1 rounded text-[10px] font-medium transition-colors"
                                style={{ background: "rgba(239,68,68,0.15)", color: "var(--red)" }}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                          {isAtish && task.kept && (
                            <div className="flex gap-1 mt-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                              <button
                                onClick={() => handleAtishDelete(task.id)}
                                className="w-full py-1 rounded text-[10px] font-medium"
                                style={{ background: "rgba(239,68,68,0.1)", color: "var(--text-muted)" }}
                              >
                                Archive
                              </button>
                            </div>
                          )}
                        </div>
                      ))}

                      {colTasks.length === 0 && (
                        <div
                          className="text-[10px] text-center py-4 rounded-lg"
                          style={{ color: "var(--text-muted)", border: "1px dashed var(--border)" }}
                        >
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

      {/* New Task Modal */}
      {showModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            className="rounded-xl p-6 w-full max-w-md mx-4"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
          >
            <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              New Task
            </h2>
            <div className="space-y-3">
              <input
                autoFocus
                type="text"
                placeholder="Task title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
                className="w-full px-3 py-2 rounded-md text-xs outline-none"
                style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
              />
              <textarea
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 rounded-md text-xs outline-none resize-none"
                style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
              />
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={form.column}
                  onChange={(e) => setForm((f) => ({ ...f, column: e.target.value }))}
                  className="px-2 py-2 rounded-md text-xs outline-none"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                >
                  {COLUMNS.filter((c) => c !== "Atish" && c !== "Archive").map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  value={form.assignee}
                  onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))}
                  className="px-2 py-2 rounded-md text-xs outline-none"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                >
                  <option value="">Unassigned</option>
                  {AGENTS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <select
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as "high" | "medium" | "low" }))}
                  className="px-2 py-2 rounded-md text-xs outline-none"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleCreate}
                disabled={saving || !form.title.trim()}
                className="flex-1 py-2 rounded-md text-xs font-medium disabled:opacity-50"
                style={{ background: "var(--accent)", color: "white" }}
              >
                {saving ? "Creating..." : "Create Task"}
              </button>
              <button
                onClick={() => { setShowModal(false); setForm(defaultForm); }}
                className="px-4 py-2 rounded-md text-xs"
                style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Feedback Modal */}
      {viewFeedback && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setViewFeedback(null); }}
        >
          <div
            className="rounded-xl p-6 w-full max-w-sm mx-4"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
          >
            <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
              Feedback
            </h2>
            <p className="text-xs mb-4 truncate" style={{ color: "var(--text-muted)" }}>
              {viewFeedback.title}
            </p>
            <div
              className="text-xs p-3 rounded-lg mb-4 leading-relaxed"
              style={{ background: "rgba(234,179,8,0.08)", color: "var(--yellow)", border: "1px solid rgba(234,179,8,0.2)" }}
            >
              {viewFeedback.text}
            </div>
            <button
              onClick={() => setViewFeedback(null)}
              className="w-full py-2 rounded-md text-xs font-medium"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setFeedbackModal(null); }}
        >
          <div
            className="rounded-xl p-6 w-full max-w-sm mx-4"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
          >
            <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
              Send back to To Do
            </h2>
            <p className="text-xs mb-4 truncate" style={{ color: "var(--text-muted)" }}>
              {feedbackModal.taskTitle}
            </p>
            <textarea
              autoFocus
              placeholder="What needs to be done differently? (optional)"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-md text-xs outline-none resize-none mb-4"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSendBack}
                className="flex-1 py-2 rounded-md text-xs font-medium"
                style={{ background: "var(--blue)", color: "white" }}
              >
                Send Back
              </button>
              <button
                onClick={() => setFeedbackModal(null)}
                className="px-4 py-2 rounded-md text-xs"
                style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
