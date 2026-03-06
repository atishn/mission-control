import { NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { OPENCLAW_ROOT } from "@/lib/config";

const JOBS_PATH = path.join(OPENCLAW_ROOT, "cron/jobs.json");

export async function GET() {
  try {
    const raw = await readFile(JOBS_PATH, "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Failed to read cron jobs:", err);
    return NextResponse.json({ version: 1, jobs: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, agentId, schedule } = body;

    if (!name || !agentId || !schedule) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Read existing jobs
    let data: { version: number; jobs: any[] } = { version: 1, jobs: [] };
    try {
      const raw = await readFile(JOBS_PATH, "utf-8");
      data = JSON.parse(raw);
    } catch {
      // File doesn't exist yet — ensure dir exists
      await mkdir(path.dirname(JOBS_PATH), { recursive: true });
    }

    const newJob = {
      id: `job-${Date.now()}`,
      name,
      agentId,
      enabled: true,
      schedule,
      payload: { text: description || name, kind: "message" },
    };

    data.jobs.push(newJob);
    await writeFile(JOBS_PATH, JSON.stringify(data, null, 2), "utf-8");

    return NextResponse.json({ success: true, job: newJob });
  } catch (err) {
    console.error("Failed to write cron job:", err);
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }
}
