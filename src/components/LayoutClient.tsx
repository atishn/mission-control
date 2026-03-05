"use client";

import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-[180px] flex flex-col">
        <TopBar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
