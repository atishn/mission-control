export default function SystemPage() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="text-center">
        <span className="text-4xl mb-4 block">⚙️</span>
        <h1 className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>System</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          OpenClaw system config and health — coming soon
        </p>
      </div>
    </div>
  );
}
