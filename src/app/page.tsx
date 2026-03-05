import { CheckSquare, Calendar, Brain, FileText, Users, Activity } from "lucide-react";

const stats = [
  { label: "Active Tasks", value: "7", icon: CheckSquare, color: "var(--blue)" },
  { label: "Scheduled Jobs", value: "3", icon: Calendar, color: "var(--green)" },
  { label: "Memories Today", value: "12", icon: Brain, color: "var(--purple)" },
  { label: "Documents", value: "24", icon: FileText, color: "var(--orange)" },
  { label: "Agents Online", value: "2", icon: Users, color: "var(--cyan)" },
  { label: "Heartbeats", value: "48", icon: Activity, color: "var(--yellow)" },
];

const recentActivity = [
  { time: "2 min ago", agent: "Smarty", action: "Completed morning brief generation", color: "var(--green)" },
  { time: "15 min ago", agent: "Scout", action: "Scanned Livingston NJ listings — 3 new", color: "var(--blue)" },
  { time: "30 min ago", agent: "Smarty", action: "Heartbeat check — all systems nominal", color: "var(--text-muted)" },
  { time: "1 hr ago", agent: "Smarty", action: "Nightly memory processing completed", color: "var(--purple)" },
  { time: "2 hr ago", agent: "Scout", action: "Content Playbook draft ready for review", color: "var(--orange)" },
];

export default function Dashboard() {
  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Smarty&apos;s automated routines &middot; Last heartbeat 2 min ago
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="rounded-lg p-4 border"
              style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {s.label}
                </span>
                <Icon size={14} style={{ color: s.color }} />
              </div>
              <span className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
                {s.value}
              </span>
            </div>
          );
        })}
      </div>

      {/* Always Running */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">✨</span>
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            Always Running
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { label: "Heartbeat Poller", freq: "Every 30 min", color: "var(--border)" },
            { label: "Trend Radar", freq: "5x daily", color: "var(--red)" },
            { label: "Opportunity Scanner", freq: "6x daily", color: "var(--orange)" },
          ].map((job) => (
            <span
              key={job.label}
              className="px-3 py-1.5 rounded-full text-xs"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)", border: `1px solid ${job.color}` }}
            >
              {job.label} &middot; {job.freq}
            </span>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>
          Recent Activity
        </h2>
        <div
          className="rounded-lg border divide-y"
          style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
        >
          {recentActivity.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderColor: "var(--border)" }}
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: item.color }}
              />
              <span className="text-xs flex-shrink-0 w-20" style={{ color: "var(--text-muted)" }}>
                {item.time}
              </span>
              <span
                className="text-xs font-medium flex-shrink-0 w-16"
                style={{ color: "var(--text-secondary)" }}
              >
                {item.agent}
              </span>
              <span className="text-xs" style={{ color: "var(--text-primary)" }}>
                {item.action}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
