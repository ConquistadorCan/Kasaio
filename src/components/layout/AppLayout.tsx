import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useInitApp } from "../../hooks/useInitApp";
import { useCheckUpdate } from "../../hooks/useCheckUpdate";
import logoNobg from "../../assets/logo-nobg.png";

export function AppLayout() {
  const { ready, error } = useInitApp();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { update, installing, install, dismiss } = useCheckUpdate();

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

      {update && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#141422] border border-white/10 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-semibold text-white">
                Update available
              </h2>
              <p className="text-sm text-white/40">
                Version <span className="text-white/70">{update.version}</span>{" "}
                is ready to install.
              </p>
              {update.body && (
                <div className="text-xs text-white/30 mt-1 leading-relaxed flex flex-col gap-0.5">
                  {update.body.split("\n").map((line, i) => (
                    <span key={i}>{line}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={dismiss}
                disabled={installing}
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-white/5 text-white/50 hover:bg-white/[0.08] hover:text-white/70 transition-colors border border-white/5 disabled:opacity-40"
              >
                Later
              </button>
              <button
                onClick={install}
                disabled={installing}
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-500 transition-colors disabled:opacity-50"
              >
                {installing ? "Installing..." : "Install & Restart"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
