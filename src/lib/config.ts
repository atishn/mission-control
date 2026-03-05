import path from "path";

/**
 * Resolve the OpenClaw workspace root.
 *
 * Priority:
 *   1. OPENCLAW_ROOT env var (set this on the server)
 *   2. Fallback to ../openclaw-workspace (sibling folder in dev)
 *
 * On the remote server, set:
 *   OPENCLAW_ROOT=/home/atish/.openclaw
 *
 * In local dev, the fallback just works since the folders are siblings.
 */
export const OPENCLAW_ROOT =
  process.env.OPENCLAW_ROOT ||
  path.resolve(process.cwd(), "../openclaw-workspace");
