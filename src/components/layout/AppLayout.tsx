import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useInitApp } from "../../hooks/useInitApp";

export function AppLayout() {
  const { ready, error } = useInitApp();

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
        <p className="text-sm text-white/20">Starting...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0a0a0f]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}