# Mission Control

A Next.js dashboard for monitoring and managing OpenClaw AI agent operations. Built with a Linear-inspired dark theme, Mission Control provides real-time visibility into agent activity, scheduled tasks, memory, and team structure.

## Overview

Mission Control is a self-hosted web interface that connects to your OpenClaw workspace to visualize:
- Agent activity and status (Office view with 2D visualization)
- Scheduled cron jobs (Calendar view)
- Agent memory and daily notes (Memory browser)
- Team structure and sub-agent hierarchy (Team view)
- Task management (coming soon)
- Project tracking (coming soon)
- Document library (coming soon)

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS with custom dark theme
- **Icons:** Lucide React
- **Data Source:** OpenClaw filesystem (JSON files, markdown)
- **Deployment:** Self-hosted on the same server as OpenClaw

## Prerequisites

- Node.js 18+ 
- OpenClaw installed and running
- Access to OpenClaw workspace directory

## Installation

```bash
# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local and set OPENCLAW_ROOT if needed
```

## Configuration

### Environment Variables

Mission Control uses environment-specific configuration for the OpenClaw workspace path:

**Development (local machine):**
- Default: `../openclaw-workspace` (sibling folder)
- Override: Create `.env.local` and set `OPENCLAW_ROOT=/path/to/openclaw-workspace`

**Production (remote server):**
- Create `.env.production` with `OPENCLAW_ROOT=/home/atish/.openclaw`
- This file is loaded automatically when running `npx next start`

### Path Configuration

The centralized config is in `src/lib/config.ts`:

```typescript
export const OPENCLAW_ROOT =
  process.env.OPENCLAW_ROOT ||
  path.resolve(process.cwd(), "../openclaw-workspace");
```

All API routes import from this config to ensure consistent path resolution.

## Development

```bash
# Start dev server on port 3333
npm run dev

# Or explicitly:
npx next dev -p 3333
```

Visit `http://localhost:3333`

## Production Deployment

```bash
# Build for production
npx next build

# Start production server on port 3333
npx next start -p 3333
```

The production build automatically loads `.env.production` for environment variables.

### Server Setup

On your remote server:

1. Clone the repository
2. Create `.env.production`:
   ```
   OPENCLAW_ROOT=/home/atish/.openclaw
   ```
3. Build and start:
   ```bash
   npm install
   npx next build
   npx next start -p 3333
   ```

## Project Structure

```
mission-control/
├── src/
│   ├── app/
│   │   ├── api/              # API routes for data fetching
│   │   │   ├── agents/       # Agent status and activity
│   │   │   ├── cron-jobs/    # Scheduled tasks
│   │   │   ├── memory/       # Agent memory files
│   │   │   └── team/         # Team structure
│   │   ├── calendar/         # Calendar page
│   │   ├── memory/           # Memory browser page
│   │   ├── office/           # 2D office visualization
│   │   ├── team/             # Team structure page
│   │   ├── layout.tsx        # Root layout with sidebar
│   │   └── page.tsx          # Dashboard home
│   ├── components/
│   │   ├── Sidebar.tsx       # Left navigation
│   │   └── TopBar.tsx        # Top bar with search
│   └── lib/
│       ├── config.ts         # Environment config
│       └── cron-parser.ts    # Cron expression parser
├── .env.local                # Local dev overrides (gitignored)
├── .env.production           # Production config (gitignored)
└── package.json
```

## Features

### 1. Office View (`/office`)

2D pixel art visualization of agent activity:
- 8 desk positions in a grid layout
- Standup table at the bottom for meetings
- Real-time status indicators:
  - 🟢 Green dot: Agent is working (activity < 5 min)
  - ⚫ Gray dot: Agent is idle/offline
  - 🟡 Yellow dot: Agent at standup
- Updates every 5 seconds
- Agent cards showing current status and tasks

**Data Source:** 
- `agents/main/sessions/sessions.json` (Smarty/Scout activity)
- `subagents/runs.json` (sub-agent spawns)

### 2. Calendar View (`/calendar`)

Week view of scheduled cron jobs:
- Day columns with time slots
- Recurring jobs shown with solid borders
- One-time jobs shown with dashed borders
- High-frequency jobs (< 1 hour) shown as "Always Running" pills
- Disabled jobs notice at the top
- Click any job to see full details in modal
- Week navigation (previous/next)

**Data Source:** `cron/jobs.json`

### 3. Memory Browser (`/memory`)

Browse agent memories and daily notes:
- Grouped by Long-Term Memory, then by month
- 13+ memory entries from Smarty and Scout
- Search and filter by agent, type, date
- Click to view full content in modal
- Sources:
  - `workspace/memory/*.md` (Smarty's daily notes)
  - `workspace/MEMORY.md` (Smarty long-term)
  - `workspace-research/MEMORY.md` (Scout long-term)

### 4. Team View (`/team`)

Agent hierarchy and configuration:
- Smarty (lead agent) with 6 sub-agents
- Scout (research agent) with 3 missions
- Shows heartbeat interval, max concurrent, model info
- Click any agent to see role details in modal
- Live data from `openclaw.json` and workspace AGENTS.md files

### 5. Dashboard Home (`/`)

Overview with stats and activity feed (placeholder - needs live data)

### 6. Navigation

Left sidebar with sections:
- **Primary:** Tasks, Calendar, Projects, Memory, Docs, Team
- **Secondary:** Office, System, Radar, Factory, Pipeline, Feedback

Top bar with:
- Search (coming soon)
- Pause button (coming soon)
- Ping Smarty button (coming soon)

## API Routes

All API routes are in `src/app/api/`:

### `/api/agents`
Returns agent status and activity:
```json
{
  "agents": [
    {
      "id": "smarty",
      "name": "Smarty",
      "emoji": "💡",
      "status": "working|idle|offline|standup",
      "currentTask": "Active session",
      "lastActivity": 1772589974046
    }
  ]
}
```

### `/api/cron-jobs`
Returns scheduled cron jobs:
```json
{
  "jobs": [
    {
      "id": "morning-brief",
      "name": "Morning Brief",
      "schedule": "0 7 * * *",
      "nextRun": "2026-03-06T12:00:00.000Z",
      "enabled": true,
      "type": "recurring"
    }
  ]
}
```

### `/api/memory`
Returns memory entries:
```json
{
  "entries": [
    {
      "id": "memory-1",
      "title": "Long-Term Memory",
      "date": "2026-03-05",
      "agent": "Smarty",
      "type": "long-term",
      "content": "..."
    }
  ]
}
```

### `/api/team`
Returns team structure:
```json
{
  "agents": [
    {
      "id": "smarty",
      "name": "Smarty",
      "role": "Squad Lead",
      "model": "claude-sonnet-4.6",
      "subAgents": [...]
    }
  ]
}
```

## OpenClaw Integration

Mission Control reads directly from OpenClaw's filesystem:

### Key Files
- **Agent sessions:** `agents/main/sessions/sessions.json`
- **Sub-agent runs:** `subagents/runs.json`
- **Cron jobs:** `cron/jobs.json`
- **Memory files:** `workspace/memory/*.md`, `workspace/MEMORY.md`
- **Agent config:** `openclaw.json`
- **Agent definitions:** `workspace/AGENTS.md`, `workspace-research/AGENTS.md`

### Status Logic

**Lead Agents (Smarty/Scout):**
- Working: Activity within last 5 minutes
- Idle: Activity 5-30 minutes ago
- Offline: No activity for 30+ minutes

**Sub-agents:**
- Working: Has active runs with `status: "running"`
- Idle: Completed run within last 5 minutes
- Offline: No recent activity

## Roadmap

### Completed ✅
- [x] Office 2D visualization with live agent status
- [x] Calendar view with cron job scheduling
- [x] Memory browser with search and filtering
- [x] Team structure with agent hierarchy
- [x] Environment-specific path configuration
- [x] Dark theme with Linear-inspired design

### In Progress 🚧
- [ ] Tasks page with live data from agent workspace
- [ ] Projects page with progress tracking
- [ ] Docs page with generated documents
- [ ] Dashboard home with live stats

### Planned 📋
- [ ] Search functionality in top bar
- [ ] Pause/resume agent operations
- [ ] Ping Smarty for quick queries
- [ ] System health monitoring
- [ ] Radar for external signals
- [ ] Factory for content generation
- [ ] Pipeline for workflow automation
- [ ] Feedback collection and analysis

## Contributing

This is a personal project for managing Atish's OpenClaw agents. If you're building something similar, feel free to use this as inspiration!

## License

Private project - not licensed for public use.
