"use client";

import { Search, Pause, Send } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TopBar() {
  const router = useRouter();

  return (
    <header className="h-14 flex items-center justify-between px-5 border-b"
      style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
      <div />
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs"
          style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
          <Search size={14} />
          Search
          <kbd className="ml-2 px-1.5 py-0.5 rounded text-[10px]"
            style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}>⌘K</kbd>
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs"
          style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
          <Pause size={14} />
          Pause
        </button>
        <button onClick={() => router.push("/chat")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium hover:opacity-90 transition-opacity"
          style={{ background: "var(--accent)", color: "white" }}>
          <Send size={14} />
          Ping Smarty
        </button>
      </div>
    </header>
  );
}
