import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useInitApp } from "../../hooks/useInitApp";
import logoNobg from "../../assets/logo-nobg.png";

export function AppLayout() {
  const { ready, error } = useInitApp();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 h-screen bg-[#08080e]">
        <img
          src={logoNobg}
          alt="Kasaio"
          className="w-16 h-16 object-contain opacity-80"
        />
        <p className="text-sm text-white/20">Starting...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0a0a0f]">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} />
      <main className="flex-1 overflow-hidden p-6 h-full">
        <Outlet />
      </main>
    </div>
  );
}
