import type { ReactNode } from "react";
import { Sidebar } from "@/components/product/Sidebar";
import { getDemoOperator } from "@/lib/auth";

/**
 * Product shell for every /app surface: fixed Sidebar + scrollable main column.
 * Data fetching lives in the pages; the layout only sets up the chrome.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  const operator = getDemoOperator();
  return (
    <div className="flex min-h-screen bg-sand">
      <Sidebar operator={operator} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
