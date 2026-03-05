"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Search, Loader2, Calendar, BookOpen, Star } from "lucide-react";

interface MemoryEntry {
  filename: string;
  date: string | null;
  label: string;
  content: string;
  agent: "smarty" | "scout";
  type: "daily" | "special" | "longterm";
}

const TYPE_ICONS: Record<string, typeof Calendar> = {
  daily: Calendar,
  special: BookOpen,
  longterm: Star,
};

const AGENT_COLORS: Record<string, string> = {
  smarty: "var(--accent)",
  scout: "var(--green)",
};

export default function MemoryPage() {
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<MemoryEntry | null>(null);
  const [filterAgent, setFilterAgent] = useState<"all" | "smarty" | "scout">("all");
  const [filterType, setFilterType] = useState<"all" | "daily" | "special" | "longterm">("all");

  const fetchMemory = useCallback(async () => {
    try {
      const res = await fetch("/api/memory");
      const data = await res.json();
      setEntries(data.entries || []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemory();
  }, [fetchMemory]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (filterAgent !== "all" && e.agent !== filterAgent) return false;
      if (filterType !== "all" && e.type !== filterType) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          e.label.toLowerCase().includes(q) ||
          e.content.toLowerCase().includes(q) ||
          e.filename.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [entries, search, filterAgent, filterType]);

  // Group daily entries by month
  const grouped = useMemo(() => {
    const groups: { label: string; entries: MemoryEntry[] }[] = [];
    let currentMonth = "";

    // Long-term memories first
    const longterm = filtered.filter((e) => e.type === "longterm");
    if (longterm.length > 0) {
      groups.push({ label: "Long-Term Memory", entries: longterm });
    }

    // Then daily/special by month
    const rest = filtered.filter((e) => e.type !== "longterm");
    for (const entry of rest) {
      const month = entry.date
        ? new Date(entry.date + "T12:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" })
        : "Other";
      if (month !== currentMonth) {
        currentMonth = month;
        groups.push({ label: month, entries: [] });
      }
      groups[groups.length - 1].entries.push(entry);
    }

    return groups;
  }, [filtered]);

  function getPreview(content: string): string {
    // Get first meaningful line after the title
    const lines = content.split("\n").filter((l) => l.trim() && !l.startsWith("#"));
    const preview = lines.slice(0, 2).join(" ").trim();
    return preview.length > 150 ? preview.slice(0, 150) + "..." : preview;
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Memory</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Browse agent memories — {entries.length} entries from the workspace
        </p>
      </div>

      {/* Search + Filters */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search memories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-md text-sm outline-none"
            style={{
              background: "var(--bg-tertiary)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
            }}
          />
        </div>
        <select
          value={filterAgent}
          onChange={(e) => setFilterAgent(e.target.value as "all" | "smarty" | "scout")}
          className="px-3 py-2 rounded-md text-xs outline-none cursor-pointer"
          style={{
            background: "var(--bg-tertiary)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border)",
          }}
        >
          <option value="all">All Agents</option>
          <option value="smarty">Smarty</option>
          <option value="scout">Scout</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as "all" | "daily" | "special" | "longterm")}
          className="px-3 py-2 rounded-md text-xs outline-none cursor-pointer"
          style={{
            background: "var(--bg-tertiary)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border)",
          }}
        >
          <option value="all">All Types</option>
          <option value="daily">Daily Notes</option>
          <option value="special">Special</option>
          <option value="longterm">Long-Term</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={20} className="animate-spin" style={{ color: "var(--text-muted)" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {search ? "No memories match your search" : "No memory files found"}
          </span>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.label}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                  {group.label}
                </span>
                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  {group.entries.length} {group.entries.length === 1 ? "entry" : "entries"}
                </span>
              </div>
              <div className="space-y-2">
                {group.entries.map((entry) => {
                  const Icon = TYPE_ICONS[entry.type] || Calendar;
                  return (
                    <button
                      key={`${entry.agent}-${entry.filename}`}
                      onClick={() => setSelectedEntry(entry)}
                      className="w-full text-left rounded-lg p-4 border cursor-pointer transition-colors"
                      style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: "var(--bg-tertiary)" }}
                        >
                          <Icon size={14} style={{ color: AGENT_COLORS[entry.agent] }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                              {entry.label}
                            </span>
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                              style={{
                                background: `color-mix(in srgb, ${AGENT_COLORS[entry.agent]} 15%, transparent)`,
                                color: AGENT_COLORS[entry.agent],
                              }}
                            >
                              {entry.agent === "smarty" ? "Smarty" : "Scout"}
                            </span>
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                              style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)" }}
                            >
                              {entry.type}
                            </span>
                          </div>
                          <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                            {getPreview(entry.content)}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Memory Detail Modal */}
      {selectedEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setSelectedEntry(null)}
        >
          <div
            className="w-full max-w-2xl rounded-xl border flex flex-col"
            style={{
              background: "var(--bg-secondary)",
              borderColor: "var(--border)",
              maxHeight: "85vh",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <div>
                <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                  {selectedEntry.label}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{
                      background: `color-mix(in srgb, ${AGENT_COLORS[selectedEntry.agent]} 15%, transparent)`,
                      color: AGENT_COLORS[selectedEntry.agent],
                    }}
                  >
                    {selectedEntry.agent === "smarty" ? "Smarty" : "Scout"}
                  </span>
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    {selectedEntry.filename}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="text-xs px-2 py-1 rounded"
                style={{ color: "var(--text-muted)" }}
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div
                className="prose prose-invert prose-sm max-w-none text-xs leading-relaxed whitespace-pre-wrap"
                style={{ color: "var(--text-primary)" }}
              >
                {selectedEntry.content}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
