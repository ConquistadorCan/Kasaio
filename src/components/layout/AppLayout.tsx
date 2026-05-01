import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import SettingsDrawer from "./SettingsDrawer";
import { useInitApp } from "../../hooks/useInitApp";
import { useCheckUpdate } from "../../hooks/useCheckUpdate";
import { useUIStore } from "../../store/useUIStore";

export function AppLayout() {
  const { ready, error } = useInitApp();
  const { update, installing, install, dismiss } = useCheckUpdate();

  if (error) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 24, height: "100vh",
        background: "var(--bg-0)",
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center" }}>
          <span style={{ fontSize: 24, fontWeight: 700, color: "var(--fg)" }}>
            Kasa<span style={{ color: "var(--accent-2)" }}>io</span>
          </span>
          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--fg-2)" }}>Failed to start</p>
          <p style={{ fontSize: 12, color: "var(--fg-4)", maxWidth: 300, lineHeight: 1.5 }}>{error}</p>
        </div>
        {update ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            padding: "16px 20px",
            background: "var(--accent-bg)",
            border: "1px solid var(--accent-line)",
            borderRadius: 10, textAlign: "center",
          }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--accent-2)" }}>
              Update available — v{update.version}
            </p>
            <p style={{ fontSize: 12, color: "var(--fg-4)" }}>Installing the update may fix this issue.</p>
            <button className="btn btn-primary" onClick={install} disabled={installing}>
              {installing ? "Installing…" : "Install & Restart"}
            </button>
          </div>
        ) : (
          <button
            className="btn btn-ghost"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (!ready) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 20, height: "100vh",
        background: "var(--bg-0)",
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: "var(--fg)", letterSpacing: "-0.02em" }}>
            Kasa<span style={{ color: "var(--accent-2)" }}>io</span>
          </span>
        </div>
        <div style={{
          width: 20, height: 20, borderRadius: "50%",
          border: "2px solid var(--line-strong)",
          borderTopColor: "var(--accent)",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <AppShell update={update} installing={installing} install={install} dismiss={dismiss} />
  );
}

function AppShell({ update, installing, install, dismiss }: {
  update: { version: string; body?: string } | null;
  installing: boolean;
  install: () => void;
  dismiss: () => void;
}) {
  const { settingsOpen, setSettingsOpen } = useUIStore();

  return (
    <div style={{
      display: "flex", height: "100vh", width: "100vw",
      overflow: "hidden",
      background: "var(--bg-1)",
      position: "relative",
    }}>
      <Sidebar />

      <div style={{
        flex: 1, minWidth: 0, height: "100%",
        display: "flex", flexDirection: "column",
        background: "var(--bg-1)",
        position: "relative", zIndex: 2,
      }}>
        <TopBar />
        <main style={{
          flex: 1, overflowY: "auto",
          padding: "20px 24px",
        }}>
          <Outlet />
        </main>
      </div>

      {/* Settings drawer rendered at layout level */}
      {settingsOpen && (
        <SettingsDrawer onClose={() => setSettingsOpen(false)} />
      )}

      {/* Update modal */}
      {update && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 80,
          background: "oklch(0 0 0 / 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            width: 380,
            background: "var(--bg-2)", border: "1px solid var(--line-strong)",
            borderRadius: 10,
            boxShadow: "0 20px 60px oklch(0 0 0 / 0.5)",
            padding: 24,
            display: "flex", flexDirection: "column", gap: 16,
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>Update available</h2>
              <p style={{ margin: 0, fontSize: 12, color: "var(--fg-3)" }}>
                Version <span className="mono" style={{ color: "var(--fg-2)" }}>{update.version}</span> is ready to install.
              </p>
            </div>
            {update.body && (
              <div style={{ maxHeight: 160, overflowY: "auto", borderTop: "1px solid var(--line)", paddingTop: 12, fontSize: 12, color: "var(--fg-3)" }}>
                {update.body}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={dismiss} disabled={installing}>Later</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={install} disabled={installing}>
                {installing ? "Installing…" : "Install & Restart"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

