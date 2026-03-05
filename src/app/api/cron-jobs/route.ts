import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { OPENCLAW_ROOT } from "@/lib/config";

export async function GET() {
  try {
    const raw = await readFile(path.join(OPENCLAW_ROOT, "cron/jobs.json"), "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Failed to read cron jobs:", err);
    // Return fallback empty structure
    return NextResponse.json({ version: 1, jobs: [] });
  }
}
