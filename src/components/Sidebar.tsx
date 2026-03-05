"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckSquare,
  Calendar,
  FolderKanban,
  Brain,
  FileText,
  Users,
  Building2,
  Settings,
  Radio,
  Factory,
  GitBranch,
  MessageSquare,
} from "lucide-react";

const navItems = [
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/memory", label: "Memory", icon: Brain },
  { href: "/docs", label: "Docs", icon: FileText },
  { href: "/team", label: "Team", icon: Users },
];

const secondaryItems = [
  { href: "/office", label: "Office", icon: Building2 },
  { href: "/system", label: "System", icon: Settings },
  { href: "/radar", label: "Radar", icon: Radio },
  { href: "/factory", label: "Factory", icon: Factory },
  { href: "/pipeline", label: "Pipeline", icon: GitBranch },
  { href: "/feedback", label: "Feedback", icon: MessageSquare },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[180px] flex flex-col border-r"
      style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-14 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
          style={{ background: "var(--accent)" }}>
          ⚡
        </div>
        <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
          Mission Control
        </span>
      </div>

      {/* Primary Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors"
              style={{
                background: isActive ? "var(--bg-hover)" : "transparent",
                color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
              }}
            >
              <Icon size={16} strokeWidth={1.8} />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-3 pb-1 px-2.5">
          <div className="h-px" style={{ background: "var(--border)" }} />
        </div>

        {secondaryItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors"
              style={{
                background: isActive ? "var(--bg-hover)" : "transparent",
                color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
              }}
            >
              <Icon size={16} strokeWidth={1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Agent avatar */}
      <div className="px-3 py-3 border-t flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: "var(--accent)", color: "white" }}>
          S
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>Smarty</span>
          <span className="text-[10px]" style={{ color: "var(--green)" }}>● Online</span>
        </div>
      </div>
    </aside>
  );
}
