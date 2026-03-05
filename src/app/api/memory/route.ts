import { NextResponse } from "next/server";
import { readFile, readdir } from "fs/promises";
import path from "path";
import { OPENCLAW_ROOT } from "@/lib/config";

interface MemoryEntry {
  filename: string;
  date: string | null; // YYYY-MM-DD or null for non-date files
  label: string;
  content: string;
  agent: "smarty" | "scout";
  type: "daily" | "special" | "longterm";
}

function extractDate(filename: string): string | null {
  const match = filename.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

function labelFromFilename(filename: string): string {
  const name = filename.replace(/\.md$/, "");
  const date = extractDate(filename);
  if (date) {
    const suffix = name.replace(date, "").replace(/^-/, "");
    if (suffix) {
      return `${date} — ${suffix.replace(/-/g, " ")}`;
    }
    const d = new Date(date + "T12:00:00");
    return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  }
  return name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function GET() {
  try {
    const entries: MemoryEntry[] = [];

    // ── Smarty's daily memory files ──
    const smartyMemDir = path.join(OPENCLAW_ROOT, "workspace", "memory");
    try {
      const files = await readdir(smartyMemDir);
      for (const file of files) {
        if (!file.endsWith(".md")) continue;
        const content = await readFile(path.join(smartyMemDir, file), "utf-8");
        const date = extractDate(file);
        entries.push({
          filename: file,
          date,
          label: labelFromFilename(file),
          content,
          agent: "smarty",
          type: date ? "daily" : "special",
        });
      }
    } catch { /* no dir */ }

    // ── Smarty's long-term MEMORY.md ──
    try {
      const content = await readFile(path.join(OPENCLAW_ROOT, "workspace", "MEMORY.md"), "utf-8");
      entries.push({
        filename: "MEMORY.md",
        date: null,
        label: "Smarty — Long-Term Memory",
        content,
        agent: "smarty",
        type: "longterm",
      });
    } catch { /* no file */ }

    // ── Scout's long-term MEMORY.md ──
    try {
      const content = await readFile(path.join(OPENCLAW_ROOT, "workspace-research", "MEMORY.md"), "utf-8");
      entries.push({
        filename: "MEMORY.md",
        date: null,
        label: "Scout — Long-Term Memory",
        content,
        agent: "scout",
        type: "longterm",
      });
    } catch { /* no file */ }

    // Sort: daily by date desc, then special, then longterm
    entries.sort((a, b) => {
      if (a.type === "longterm" && b.type !== "longterm") return 1;
      if (b.type === "longterm" && a.type !== "longterm") return -1;
      if (a.date && b.date) return b.date.localeCompare(a.date);
      if (a.date && !b.date) return -1;
      if (!a.date && b.date) return 1;
      return a.label.localeCompare(b.label);
    });

    return NextResponse.json({ entries });
  } catch (err) {
    console.error("Failed to read memory:", err);
    return NextResponse.json({ entries: [] });
  }
}
