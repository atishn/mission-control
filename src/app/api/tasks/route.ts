import { NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { OPENCLAW_ROOT } from "@/lib/config";

const TASKS_FILE = path.join(OPENCLAW_ROOT, "workspace", "tasks.json");

interface Task {
  id: string;
  title: string;
  description: string;
  column: string;
  assignee: string | null;
  priority: "high" | "medium" | "low";
  status: "normal" | "blocked" | "waiting";
  feedback: string | null;
  movedToAtishAt: string | null;
  kept?: boolean;
  createdAt: string;
  updatedAt: string;
}

async function readTasks() {
  try {
    const content = await readFile(TASKS_FILE, "utf-8");
    return JSON.parse(content) as { tasks: Task[] };
  } catch {
    return { tasks: [] };
  }
}

const ACTIVE_COLUMNS = ["To Do", "In Progress", "QA", "Review"];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") || "all";

  const data = await readTasks();
  let tasks = data.tasks;

  switch (filter) {
    case "active":
      tasks = tasks.filter((t) => ACTIVE_COLUMNS.includes(t.column));
      break;
    case "review":
      tasks = tasks.filter((t) => t.column === "Review");
      break;
    case "done":
      tasks = tasks.filter((t) => t.column === "Done");
      break;
    case "waiting":
      tasks = tasks.filter((t) => t.status === "waiting" || t.status === "blocked");
      break;
    // "all" — no filter
  }

  return NextResponse.json({ tasks });
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const data = await readTasks();
  const now = new Date().toISOString();

  const task: Task = {
    id: `task-${Date.now()}`,
    title: body.title.trim(),
    description: body.description || "",
    column: body.column || "To Do",
    assignee: body.assignee || null,
    priority: body.priority || "medium",
    status: body.status || "normal",
    feedback: null,
    movedToAtishAt: null,
    createdAt: now,
    updatedAt: now,
  };

  data.tasks.push(task);
  await writeFile(TASKS_FILE, JSON.stringify(data, null, 2), "utf-8");

  return NextResponse.json({ task }, { status: 201 });
}
