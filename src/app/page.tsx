"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckSquare, Calendar, Brain, FileText, Users, Activity, Loader2 } from "lucide-react";

interface DashboardData {
  stats: {
    agentsOnline: number;
    scheduledJobs: number;
    memoriesToday: number;
    documents: number;
    activeTasks: number;
  };
  recentActivity: {
    time: string;
    agent: string;
    action: string;
    color: string;
  }[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      setData(json);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const s = data?.stats;

  const stats = [
    { label: "Active Tasks",    value: s?.activeTasks ?? "—",    icon: CheckSquare, color: "var(--blue)" },
    { label: "Scheduled Jobs",  value: s?.scheduledJobs ?? "—",  icon: Calendar,    color: "var(--green)" },
    { label: "Memories Today",  value: s?.memoriesToday ?? "—",  icon: Brain,       color: "var(--purple)" },
    { label: "Documents",       value: s?.documents ?? "—",      icon: FileText,    color: "var(--orange)" },
    { label: "Agents Online",   value: s?.agentsOnline ?? "—",   icon: Users,       color: "var(--cyan)" },
    { label: "Heartbeat",       value: "30m",                    icon: Activity,    color: "var(--yellow)" },
  ];

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Smarty&apos;s automated routines &middot; {loading ? "Loading…" : `${s?.agentsOnline ?? 0} agent${s?.agentsOnline === 1 ? "" : "s"} online`}
          </p>
        </div>
        {loading && <Loader2 size={16} className="animate-spin" style={{ color: "var(--text-muted)" }} />}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-lg p-4 border"
              style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{s.label}</span>
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
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Always Running</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { label: "Heartbeat Poller", freq: "Every 30 min", color: "var(--border)" },
            { label: "Morning Brief",    freq: "7 AM daily",   color: "var(--orange)" },
            { label: "Memory Processor", freq: "2 AM daily",   color: "var(--purple)" },
            { label: "Exec Sync",        freq: "8 AM daily",   color: "var(--blue)" },
          ].map((job) => (
            <span key={job.label} className="px-3 py-1.5 rounded-full text-xs"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)", border: `1px solid ${job.color}` }}>
              {job.label} &middot; {job.freq}
            </span>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>Recent Activity</h2>
        <div className="rounded-lg border divide-y"
          style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
          {(data?.recentActivity ?? []).length === 0 && !loading ? (
            <div className="px-4 py-6 text-center text-xs" style={{ color: "var(--text-muted)" }}>
              No recent activity
            </div>
          ) : (data?.recentActivity ?? []).map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3"
              style={{ borderColor: "var(--border)" }}>
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
              <span className="text-xs flex-shrink-0 w-20" style={{ color: "var(--text-muted)" }}>{item.time}</span>
              <span className="text-xs font-medium flex-shrink-0 w-16" style={{ color: "var(--text-secondary)" }}>{item.agent}</span>
              <span className="text-xs" style={{ color: "var(--text-primary)" }}>{item.action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
