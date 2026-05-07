import Sidebar from "@/components/dashboard/Sidebar";
import CommandPalette from "@/components/dashboard/CommandPalette";
import QuickLog from "@/components/dashboard/QuickLog";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto min-h-screen">
        {children}
      </main>
      <CommandPalette />
      <QuickLog />
    </div>
  );
}
