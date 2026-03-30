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
      <div className="flex flex-col items-center justify-center gap-6 h-screen bg-[#08080e]">
        <img
          src={logoNobg}
          alt="Kasaio"
          className="w-12 h-12 object-contain opacity-40"
        />
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm font-medium text-white/60">Failed to start</p>
          <p className="text-xs text-white/25 max-w-xs leading-relaxed">
            {error}
          </p>
        </div>
        {update ? (
          <div className="flex flex-col items-center gap-2 px-5 py-4 rounded-xl bg-violet-500/10 border border-violet-500/20 text-center">
            <p className="text-sm font-medium text-violet-300">Update available — v{update.version}</p>
            <p className="text-xs text-white/30">Installing the update may fix this issue.</p>
            <button
              onClick={install}
              disabled={installing}
              className="mt-1 px-4 py-2 rounded-lg text-xs font-medium bg-violet-600 text-white hover:bg-violet-500 transition-colors disabled:opacity-50"
            >
              {installing ? "Installing..." : "Install & Restart"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70 border border-white/5 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 h-screen bg-[#08080e]">
        <div className="flex flex-col items-center gap-4">
          <img
            src={logoNobg}
            alt="Kasaio"
            className="w-16 h-16 object-contain"
          />
          <span className="text-xl font-semibold tracking-tight text-white">
            kasa<span className="text-violet-400">io</span>
          </span>
        </div>
        <div className="w-5 h-5 rounded-full border-2 border-white/10 border-t-violet-500 animate-spin" />
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
              <h2 className="text-base font-semibold text-white">Update available</h2>
              <p className="text-sm text-white/40">
                Version <span className="text-white/70 font-mono">{update.version}</span> is ready to install.
              </p>
            </div>

            {update.body && (
              <div className="max-h-48 overflow-y-auto flex flex-col gap-2 border-t border-white/5 pt-4">
                {update.body.split("\n").reduce<{ sections: { heading: string; items: string[] }[]; current: { heading: string; items: string[] } | null }>((acc, raw) => {
                  const line = raw.trim();
                  if (!line) return acc;
                  if (line.startsWith("### ")) {
                    const section = { heading: line.replace(/^###\s*/, ""), items: [] };
                    acc.sections.push(section);
                    acc.current = section;
                  } else if (line.startsWith("- ") && acc.current) {
                    acc.current.items.push(line.slice(2));
                  }
                  return acc;
                }, { sections: [], current: null }).sections.map((section, si) => (
                  <div key={si}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/25 mb-1.5">{section.heading}</p>
                    <ul className="flex flex-col gap-1">
                      {section.items.map((item, ii) => (
                        <li key={ii} className="flex items-start gap-2 text-xs text-white/50 leading-relaxed">
                          <span className="text-violet-400 mt-0.5 shrink-0">·</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

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
