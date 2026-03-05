export default function ProjectsPage() {
  const projects = [
    { name: "Mission Control Dashboard", progress: 25, status: "active", tasks: 12, lastActivity: "2 min ago" },
    { name: "Career Visibility — LinkedIn/X", progress: 40, status: "active", tasks: 8, lastActivity: "1 hr ago" },
    { name: "House Search — Livingston NJ", progress: 60, status: "active", tasks: 5, lastActivity: "3 hr ago" },
    { name: "Business Acquisition Pipeline", progress: 15, status: "active", tasks: 6, lastActivity: "1 day ago" },
    { name: "OpenClaw Agent Optimization", progress: 70, status: "active", tasks: 4, lastActivity: "5 hr ago" },
  ];

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Projects</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Major initiatives — stay focused on what moves the ball forward
          </p>
        </div>
        <button
          className="px-3 py-1.5 rounded-md text-xs font-medium"
          style={{ background: "var(--accent)", color: "white" }}
        >
          + New Project
        </button>
      </div>

      <div className="space-y-3">
        {projects.map((p) => (
          <div
            key={p.name}
            className="rounded-lg p-4 border cursor-pointer transition-colors"
            style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{p.name}</span>
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{p.lastActivity}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-tertiary)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${p.progress}%`, background: "var(--accent)" }}
                />
              </div>
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{p.progress}%</span>
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{p.tasks} tasks</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
