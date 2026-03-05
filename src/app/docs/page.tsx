export default function DocsPage() {
  const docs = [
    { title: "Content Playbook — Week of Mar 3", type: "Report", agent: "Scout", date: "Mar 3", color: "var(--blue)" },
    { title: "Morning Brief — Mar 4", type: "Brief", agent: "Smarty", date: "Mar 4", color: "var(--orange)" },
    { title: "House Radar — Mar 4", type: "Report", agent: "Scout", date: "Mar 4", color: "var(--green)" },
    { title: "Mission Control Architecture", type: "PRD", agent: "Smarty", date: "Mar 2", color: "var(--purple)" },
    { title: "Deal Flow — Week of Feb 26", type: "Report", agent: "Scout", date: "Feb 26", color: "var(--red)" },
    { title: "Newsletter Draft — Feb 27", type: "Draft", agent: "Smarty", date: "Feb 27", color: "var(--yellow)" },
    { title: "Agent Team Structure", type: "Doc", agent: "Smarty", date: "Feb 28", color: "var(--cyan)" },
  ];

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Documents</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Every doc your agents create — searchable and categorized
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search documents..."
          className="w-full px-3 py-2 rounded-md text-sm outline-none"
          style={{
            background: "var(--bg-tertiary)",
            color: "var(--text-primary)",
            border: "1px solid var(--border)",
          }}
        />
      </div>

      {/* Doc list */}
      <div
        className="rounded-lg border divide-y"
        style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
      >
        {docs.map((doc, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{ background: doc.color }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate" style={{ color: "var(--text-primary)" }}>{doc.title}</p>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{doc.agent} &middot; {doc.date}</p>
            </div>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
            >
              {doc.type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
