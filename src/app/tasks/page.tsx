export default function TasksPage() {
  const columns = [
    { title: "Backlog", count: 3, color: "var(--text-muted)" },
    { title: "In Progress", count: 2, color: "var(--blue)" },
    { title: "Review", count: 1, color: "var(--yellow)" },
    { title: "Done", count: 4, color: "var(--green)" },
  ];

  const sampleTasks: Record<string, { title: string; assignee: string; priority: string }[]> = {
    Backlog: [
      { title: "Build Radar screen for Scout alerts", assignee: "S", priority: "medium" },
      { title: "Set up weekly newsletter cron job", assignee: "S", priority: "low" },
      { title: "Research Livingston school districts", assignee: "Sc", priority: "medium" },
    ],
    "In Progress": [
      { title: "Mission Control dashboard build", assignee: "S", priority: "high" },
      { title: "Morning brief optimization", assignee: "S", priority: "medium" },
    ],
    Review: [
      { title: "Content Playbook — Week of Mar 3", assignee: "Sc", priority: "high" },
    ],
    Done: [
      { title: "Configure Slack integration", assignee: "S", priority: "medium" },
      { title: "Set up nightly memory processor", assignee: "S", priority: "high" },
      { title: "House Radar daily scan setup", assignee: "Sc", priority: "high" },
      { title: "Agent team structure documentation", assignee: "A", priority: "low" },
    ],
  };

  const priorityColor: Record<string, string> = {
    high: "var(--red)",
    medium: "var(--yellow)",
    low: "var(--text-muted)",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Task Board</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Track what Smarty and Scout are working on
          </p>
        </div>
        <button
          className="px-3 py-1.5 rounded-md text-xs font-medium"
          style={{ background: "var(--accent)", color: "white" }}
        >
          + New Task
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {columns.map((col) => (
          <div key={col.title}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                {col.title}
              </span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)" }}
              >
                {col.count}
              </span>
            </div>
            <div className="space-y-2">
              {(sampleTasks[col.title] || []).map((task, i) => (
                <div
                  key={i}
                  className="rounded-lg p-3 border cursor-pointer transition-colors"
                  style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
                >
                  <p className="text-xs mb-2" style={{ color: "var(--text-primary)" }}>{task.title}</p>
                  <div className="flex items-center justify-between">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
                    >
                      {task.assignee}
                    </div>
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: priorityColor[task.priority] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
