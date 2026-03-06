import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { OPENCLAW_ROOT } from "@/lib/config";

// ── GET: load session history from JSONL transcript ──────────────────────────

export async function GET() {
  try {
    const allSessions: Record<string, any> = {};
    for (const dir of ["smarty", "main"]) {
      try {
        const raw = await readFile(path.join(OPENCLAW_ROOT, `agents/${dir}/sessions/sessions.json`), "utf-8");
        Object.assign(allSessions, JSON.parse(raw));
      } catch {}
    }

    const session = allSessions["agent:smarty:main"] || allSessions["agent:main:main"];
    if (!session?.sessionId) return NextResponse.json({ messages: [] });

    const candidates = [
      session.transcriptPath,
      path.join(OPENCLAW_ROOT, `agents/smarty/sessions/${session.sessionId}.jsonl`),
      path.join(OPENCLAW_ROOT, `agents/main/sessions/${session.sessionId}.jsonl`),
    ].filter(Boolean);

    let raw = "";
    for (const p of candidates) {
      try { raw = await readFile(p, "utf-8"); break; } catch {}
    }
    if (!raw) return NextResponse.json({ messages: [] });

    const messages: { role: string; content: string; timestamp: number }[] = [];
    for (const line of raw.trim().split("\n")) {
      try {
        const entry = JSON.parse(line);
        if (entry.type !== "message" || !entry.message) continue;
        const msg = entry.message;
        if (msg.role !== "user" && msg.role !== "assistant") continue;

        let text = "";
        if (typeof msg.content === "string") {
          text = msg.content.trim();
        } else if (Array.isArray(msg.content)) {
          text = msg.content
            .filter((b: any) => b.type === "text")
            .map((b: any) => b.text)
            .join("\n")
            .trim();
        }
        if (!text) continue;

        // Clean user messages — strip OpenClaw metadata envelope
        if (msg.role === "user") {
          // Pattern 1: "[Day YYYY-MM-DD HH:MM TZ] actual message"
          const tsMatch = text.match(/^\[[A-Za-z]+ \d{4}-\d{2}-\d{2} \d{2}:\d{2} \w+\]\s*/);
          if (tsMatch) {
            text = text.slice(tsMatch[0].length).trim();
          } else {
            // Pattern 2: metadata envelope ending with ``` fence, actual message after
            const lastFence = text.lastIndexOf("\n```\n");
            if (lastFence !== -1) {
              text = text.slice(lastFence + 5).trim();
            }
          }
          if (!text) continue; // skip if nothing left after stripping
        }

        const ts = entry.timestamp ? new Date(entry.timestamp).getTime() : 0;
        messages.push({ role: msg.role, content: text, timestamp: ts });
      } catch {}
    }

    return NextResponse.json({ messages: messages.slice(-80) });
  } catch {
    return NextResponse.json({ messages: [] });
  }
}

// ── POST: send message to Smarty via OpenClaw CLI (fire-and-forget) ──────────
// Response appears in chat history via polling — no need to wait synchronously.

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

    const { spawn } = await import("child_process");
    const child = spawn("openclaw", ["agent", "--agent", "smarty", "--message", message.trim()], {
      detached: true,
      stdio: "ignore",
    });
    child.unref();

    return NextResponse.json({ status: "sent" });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Send failed" }, { status: 500 });
  }
}



