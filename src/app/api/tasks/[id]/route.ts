import { NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { OPENCLAW_ROOT } from "@/lib/config";

const TASKS_FILE = path.join(OPENCLAW_ROOT, "workspace", "tasks.json");

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  let data: { tasks: Record<string, unknown>[] };
  try {
    const content = await readFile(TASKS_FILE, "utf-8");
    data = JSON.parse(content);
  } catch {
    return NextResponse.json({ error: "Tasks file not found" }, { status: 500 });
  }

  const idx = data.tasks.findIndex((t) => t.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  data.tasks[idx] = {
    ...data.tasks[idx],
    ...body,
    id, // prevent id override
    updatedAt: new Date().toISOString(),
  };

  await writeFile(TASKS_FILE, JSON.stringify(data, null, 2), "utf-8");
  return NextResponse.json({ task: data.tasks[idx] });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let data: { tasks: Record<string, unknown>[] };
  try {
    const content = await readFile(TASKS_FILE, "utf-8");
    data = JSON.parse(content);
  } catch {
    return NextResponse.json({ error: "Tasks file not found" }, { status: 500 });
  }

  const before = data.tasks.length;
  data.tasks = data.tasks.filter((t) => t.id !== id);
  if (data.tasks.length === before) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  await writeFile(TASKS_FILE, JSON.stringify(data, null, 2), "utf-8");
  return NextResponse.json({ ok: true });
}
