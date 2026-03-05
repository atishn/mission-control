import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { OPENCLAW_ROOT } from "@/lib/config";
import WebSocket from "ws";

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
        const msg = JSON.parse(line);
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

        messages.push({ role: msg.role, content: text, timestamp: msg.timestamp || 0 });
      } catch {}
    }

    return NextResponse.json({ messages: messages.slice(-80) });
  } catch {
    return NextResponse.json({ messages: [] });
  }
}

// ── POST: send message to Smarty via gateway WebSocket RPC ───────────────────

interface GatewayRPCRequest { jsonrpc: "2.0"; id: number; method: string; params?: any; }
interface GatewayRPCResponse { jsonrpc: "2.0"; id: number; result?: any; error?: { code: number; message: string }; }

async function callGateway(port: number, token: string, method: string, params: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${port}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const id = Date.now();
    const timeout = setTimeout(() => { ws.close(); reject(new Error("Gateway timeout")); }, 60000);

    ws.on("open", () => ws.send(JSON.stringify({ jsonrpc: "2.0", id, method, params } as GatewayRPCRequest)));
    ws.on("message", (data: WebSocket.Data) => {
      try {
        const res: GatewayRPCResponse = JSON.parse(data.toString());
        if (res.id !== id) return;
        clearTimeout(timeout); ws.close();
        res.error ? reject(new Error(res.error.message)) : resolve(res.result);
      } catch (e) { clearTimeout(timeout); ws.close(); reject(e); }
    });
    ws.on("error", (e) => { clearTimeout(timeout); reject(e); });
  });
}

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

    const configRaw = await readFile(path.join(OPENCLAW_ROOT, "openclaw.json"), "utf-8");
    const config = JSON.parse(configRaw);
    const port: number = config.gateway?.port || 18789;
    const token: string = config.gateway?.auth?.token || "";

    const result = await callGateway(port, token, "sessions.send", {
      sessionKey: "agent:smarty:main",
      message,
      wait: true,
    });

    let response = "No response";
    if (result?.reply) {
      response = result.reply;
    } else if (result?.response) {
      response = result.response;
    } else if (result?.messages) {
      const last = [...result.messages].reverse().find((m: any) => m.role === "assistant");
      if (last) {
        response = Array.isArray(last.content)
          ? last.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n")
          : last.content;
      }
    }

    return NextResponse.json({ response });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Gateway error" }, { status: 500 });
  }
}



