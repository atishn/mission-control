---
inclusion: auto
---

# Mission Control — Kiro Steering

## Project Overview

Mission Control is a custom Next.js dashboard for managing and visualizing Atish's OpenClaw AI agent system. It runs on the same server where OpenClaw operates, providing a web-based interface to monitor agents, tasks, memory, cron jobs, and documents in real-time.

Inspired by the "Mission Control" concept from `MissionControlTranscript.log` — a personalized dashboard where every tool is custom-built by the AI agents, not downloaded or pre-made.

## Owner

- **Name:** Atish
- **Location:** Rutherford, NJ
- **Timezone:** America/New_York
- **OpenClaw server:** Linux server running OpenClaw at `/home/atish/.openclaw/`
- **Dev machine:** macOS with openclaw-workspace and mission-control as sibling folders

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS — clean, Linear-inspired dark theme
- **Icons:** Lucide React
- **Hosting:** Self-hosted on the same server as OpenClaw (port 3333)
- **Data source:** OpenClaw's filesystem (JSON files, markdown)
- **State:** Server-side where possible, minimal client state

## Design Principles

- Clean, minimal interface inspired by Linear
- Dark mode by default with custom CSS variables
- Left sidebar navigation for all tools
- Real-time updates (5-second polling where applicable)
- Mobile-responsive for quick checks from phone
- No unnecessary complexity — each screen serves a clear purpose
- Direct filesystem reads — no database layer

## Architecture

### Path Configuration

Mission Control uses environment-specific paths via `src/lib/config.ts`:

```typescript
export const OPENCLAW_ROOT =
  process.env.OPENCLAW_ROOT ||
  path.resolve(process.cwd(), "../openclaw-workspace");
```

**Development:** Defaults to `../openclaw-workspace` (sibling folder)
**Production:** Set `OPENCLAW_ROOT=/home/atish/.openclaw` in `.env.production`

All API routes import from this centralized config.

### API Routes Pattern

All data fetching happens server-side via Next.js API routes in `src/app/api/`:
- `/api/agents` - Agent status and activity
- `/api/cron-jobs` - Scheduled tasks
- `/api/memory` - Memory entries
- `/api/team` - Team structure

Each route:
1. Imports `OPENCLAW_ROOT` from config
2. Reads JSON/markdown files from OpenClaw workspace
3. Parses and transforms data
4. Returns JSON response

Client components fetch from these routes and poll for updates.

## Core Screens (Implementation Status)

### 1. Office View ✅ LIVE
**Route:** `/office`
**Status:** Fully implemented with live data

Features:
- 2D SVG office layout with 8 desk positions + standup table
- Real-time agent status visualization
- Status indicators: 🟢 working, ⚫ idle/offline, 🟡 standup
- Updates every 5 seconds
- Agent cards showing current tasks
- Agents stay at desks unless at standup

Data sources:
- `agents/main/sessions/sessions.json` (Smarty/Scout sessions)
- `subagents/runs.json` (sub-agent spawns)

Status logic:
- **Working:** Activity < 5 minutes ago
- **Idle:** Activity 5-30 minutes ago
- **Offline:** No activity for 30+ minutes
- **Standup:** Special case (not yet implemented)

### 2. Calendar / Scheduled Tasks ✅ LIVE
**Route:** `/calendar`
**Status:** Fully implemented with live data

Features:
- Week view with day columns
- Today indicator
- Week navigation (previous/next)
- Recurring jobs (solid border) vs one-time jobs (dashed border)
- High-frequency jobs shown as "Always Running" pills
- Disabled jobs notice
- Click job to see full details in modal
- Cron expression parser for next run calculation

Data source: `cron/jobs.json`

Current jobs:
- Morning Brief (7 AM ET daily)
- MarTech Conference Reminder (Mar 4, 2026 one-time)
- Nightly Memory Processor (2 AM ET daily)

### 3. Memory Viewer ✅ LIVE
**Route:** `/memory`
**Status:** Fully implemented with live data

Features:
- 13+ memory entries from Smarty and Scout
- Grouped by Long-Term Memory, then by month (March 2026, February 2026)
- Search functionality
- Filter by agent (Smarty/Scout) and type (long-term/daily/special)
- Click to view full content in modal
- Journal-like reading experience

Data sources:
- `workspace/memory/*.md` (Smarty's daily notes)
- `workspace/MEMORY.md` (Smarty long-term)
- `workspace-research/MEMORY.md` (Scout long-term)

### 4. Team / Org Structure ✅ LIVE
**Route:** `/team`
**Status:** Fully implemented with live data

Features:
- Clear hierarchy: Smarty (lead) → 6 sub-agents, Scout (research) → 3 missions
- Shows heartbeat interval, max concurrent, model info
- Click agent to see role details in modal
- Live data from config and workspace files

Data sources:
- `openclaw.json` (agent list, models, tools, defaults)
- `workspace/AGENTS.md` (sub-agent definitions)
- `workspace-research/AGENTS.md` (Scout missions)

### 5. Dashboard Home 🚧 PLACEHOLDER
**Route:** `/`
**Status:** Hardcoded placeholder

Needs:
- Live stats from agent activity
- Recent activity feed
- Quick actions
- System health indicators

### 6. Task Board 📋 PLANNED
**Route:** `/tasks`
**Status:** Hardcoded placeholder kanban

Planned features:
- Columns: Backlog → In Progress → Review → Done
- Tasks assigned to Smarty (H) or Atish (A)
- Live activity feed showing agent actions
- New task button
- Source: agent workspace files, sub-agent runs

### 7. Projects 📋 PLANNED
**Route:** `/projects`
**Status:** Hardcoded placeholder

Planned features:
- Track major projects
- Progress indicators, status, last activity
- Links to related tasks, memories, documents
- Reverse-prompt integration

### 8. Documents 📋 PLANNED
**Route:** `/docs`
**Status:** Hardcoded placeholder

Planned features:
- All documents generated by agents
- Auto-categorized by type and format
- Searchable
- Markdown to HTML rendering
- Source: agent workspace files

### 9. Secondary Pages 📋 PLANNED
**Routes:** `/system`, `/radar`, `/factory`, `/pipeline`, `/feedback`
**Status:** "Coming soon" placeholders

## OpenClaw Integration Points

### Gateway API (Not Used Yet)
- OpenClaw gateway runs on `localhost:18789` with token auth
- Token: stored in `openclaw.json` under `gateway.auth.token`
- Currently only exposes `/v1/responses` endpoint (disabled by default)
- Does NOT provide REST API for cron/memory/sessions data
- Decision: Use filesystem reads instead of gateway API

### Filesystem (Primary Data Source)

All data comes from direct file reads:

```
~/.openclaw/
├── agents/
│   └── main/
│       └── sessions/
│           └── sessions.json          # Agent activity
├── subagents/
│   └── runs.json                      # Sub-agent spawns
├── cron/
│   └── jobs.json                      # Scheduled tasks
├── workspace/
│   ├── memory/                        # Daily notes
│   │   ├── 2026-03-05.md
│   │   └── ...
│   ├── AGENTS.md                      # Sub-agent definitions
│   ├── MEMORY.md                      # Long-term memory
│   ├── SOUL.md
│   ├── IDENTITY.md
│   └── USER.md
├── workspace-research/
│   ├── AGENTS.md                      # Scout missions
│   └── MEMORY.md                      # Scout memory
└── openclaw.json                      # Main config
```

### Agent Config Reference

**Smarty (Main Agent):**
- ID: `main`
- Model: `kiro/claude-sonnet-4.6`
- Workspace: `/home/atish/.openclaw/workspace`
- Heartbeat: Every 30 minutes
- Max concurrent: 4
- Role: Squad lead, task execution, memory management

**Scout (Research Agent):**
- ID: `scout`
- Model: `kiro/claude-sonnet-4.6`
- Workspace: `/home/atish/.openclaw/workspace-research`
- Tools: Read-only (no write/exec)
- Role: Research, content discovery, market scanning

**Sub-agents (6 total):**
- Architect 🏗️ - System design
- Developer ⚡ - Code implementation
- Tester 🧪 - Quality assurance
- Designer 🎨 - UI/UX design
- Planner 📋 - Project planning
- Researcher 📚 - Deep research

**Scout Missions (3 total):**
- House Radar - Livingston NJ listing scan
- Content Playbook - Career visibility digest
- Deal Flow - Business acquisition scan

## Cron Jobs (Current Schedule)

### Active Jobs

| Job | Schedule | Agent | Purpose | Status |
|-----|----------|-------|---------|--------|
| Morning Brief | 0 7 * * * (7 AM ET daily) | Smarty | Weather, trending content, task suggestions | ✅ Enabled |
| Nightly Memory Processor | 0 2 * * * (2 AM ET daily) | Smarty | Memory consolidation, indexing | ✅ Enabled |

### One-Time Jobs

| Job | Date | Agent | Purpose | Status |
|-----|------|-------|---------|--------|
| MarTech Conference Reminder | Mar 4, 2026 | Smarty | Conference reminder | ✅ Enabled |

### Planned (Scout)

Defined in `workspace-research/AGENTS.md` but not yet in `jobs.json`:

| Job | Schedule | Purpose |
|-----|----------|---------|
| House Radar | 0 7 * * * (7:30 AM ET daily) | Livingston NJ listing scan |
| Content Playbook | 0 8 * * 1 (8 AM ET Monday) | Career visibility digest |
| Deal Flow | 0 9 * * 3 (9 AM ET Wednesday) | Business acquisition scan |

## Development Workflow

### Local Development

```bash
# Start dev server
cd mission-control
npm run dev
# or
npx next dev -p 3333
```

Visit `http://localhost:3333`

The app will read from `../openclaw-workspace` by default (sibling folder).

### Production Deployment

On the remote server:

```bash
# Build
npx next build

# Start (loads .env.production automatically)
npx next start -p 3333
```

The `.env.production` file should contain:
```
OPENCLAW_ROOT=/home/atish/.openclaw
```

### File Structure

```
mission-control/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── agents/route.ts
│   │   │   ├── cron-jobs/route.ts
│   │   │   ├── memory/route.ts
│   │   │   └── team/route.ts
│   │   ├── calendar/page.tsx
│   │   ├── memory/page.tsx
│   │   ├── office/page.tsx
│   │   ├── team/page.tsx
│   │   ├── layout.tsx        # Root layout with sidebar
│   │   ├── globals.css       # Dark theme CSS variables
│   │   └── page.tsx          # Dashboard home
│   ├── components/
│   │   ├── Sidebar.tsx       # Left navigation
│   │   └── TopBar.tsx        # Top bar
│   └── lib/
│       ├── config.ts         # OPENCLAW_ROOT config
│       └── cron-parser.ts    # Cron expression parser
├── .env.local                # Local dev overrides (gitignored)
├── .env.production           # Production config (gitignored)
├── .kiro/
│   └── steering/
│       └── mission-control-project.md  # This file
├── package.json
├── tailwind.config.ts
└── README.md
```

## Coding Guidelines for Mission Control

When working on Mission Control features:

1. **Always use live data** - No hardcoded placeholders in production features
2. **Import from config** - Use `import { OPENCLAW_ROOT } from "@/lib/config"` in all API routes
3. **Server-side data fetching** - Use API routes, not client-side file reads
4. **Error handling** - Gracefully handle missing files with try/catch
5. **Polling for updates** - Use 5-second intervals for real-time data
6. **Dark theme** - Use CSS variables from `globals.css` for colors
7. **Minimal code** - Keep implementations simple and focused
8. **No databases** - OpenClaw files are the source of truth
9. **Responsive design** - Mobile-friendly layouts
10. **TypeScript** - Use proper types for all data structures

## Design System

### Colors (CSS Variables)

```css
--bg-primary: #0a0a0a;
--bg-secondary: #111111;
--bg-tertiary: #1a1a1a;
--border: #2a2a2a;
--text-primary: #ffffff;
--text-secondary: #a0a0a0;
--text-muted: #666666;
--accent: #3b82f6;
--green: #10b981;
--red: #ef4444;
--yellow: #eab308;
--blue: #3b82f6;
--purple: #a855f7;
--orange: #f97316;
--cyan: #06b6d4;
```

### Status Colors

- 🟢 Green (#10b981): Working, active, enabled
- ⚫ Gray (#6b7280): Idle, offline, disabled
- 🟡 Yellow (#eab308): Standup, warning, pending
- 🔴 Red (#ef4444): Error, critical (use sparingly)

### Typography

- Headings: `text-xl font-semibold`
- Body: `text-sm`
- Muted: `text-xs` with `color: var(--text-muted)`

## Next Steps

### Immediate (High Priority)
1. Build Tasks page with live data from agent workspace
2. Build Projects page with progress tracking
3. Build Docs page with generated documents
4. Update Dashboard home with live stats

### Short Term
1. Implement search functionality in top bar
2. Add "Ping Smarty" quick query feature
3. Add "Pause" button for agent operations
4. System health monitoring page

### Long Term
1. Radar for external signals (RSS, APIs, webhooks)
2. Factory for content generation workflows
3. Pipeline for multi-step automation
4. Feedback collection and analysis
5. Mobile app (React Native or PWA)

## Mission Statement

Build an autonomous organization of AI agents that produce value 24/7, with Mission Control as the command center for monitoring, managing, and optimizing agent operations.

Every tool in Mission Control is custom-built by the agents themselves, creating a self-improving system where the dashboard evolves alongside the agents it monitors.
