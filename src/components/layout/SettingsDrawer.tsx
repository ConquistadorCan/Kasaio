import { useState } from "react";
import { X } from "lucide-react";
import { Categories } from "../../pages/Categories";
import { useUIStore } from "../../store/useUIStore";
import { useCheckUpdate } from "../../hooks/useCheckUpdate";
import { getVersion } from "@tauri-apps/api/app";
import { useEffect } from "react";

type Tab = "categories" | "price-sources" | "preferences" | "about";

interface Props {
  onClose: () => void;
}

export default function SettingsDrawer({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>("categories");
  const { walletView, setWalletView } = useUIStore();
  const { update, install, installing } = useCheckUpdate();
  const [version, setVersion] = useState("");

  useEffect(() => {
    getVersion().then(setVersion).catch(() => setVersion("—"));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const TABS: { id: Tab; label: string }[] = [
    { id: "categories",    label: "Categories" },
    { id: "price-sources", label: "Price sources" },
    { id: "preferences",   label: "Preferences" },
    { id: "about",         label: "About" },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 49,
          background: "oklch(0 0 0 / 0.45)",
          backdropFilter: "blur(2px)",
        }}
      />

      {/* Drawer */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: 720, zIndex: 50,
        display: "flex",
        background: "var(--bg-1)",
        border: "1px solid var(--line)",
        boxShadow: "-20px 0 60px oklch(0 0 0 / 0.4)",
        animation: "slideIn 200ms ease-out",
      }}>
        <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>

        {/* Tab rail */}
        <div style={{
          width: 180, flexShrink: 0,
          background: "var(--bg-0)",
          borderRight: "1px solid var(--line)",
          display: "flex", flexDirection: "column",
          padding: "16px 0",
        }}>
          <div style={{
            padding: "0 16px 16px",
            borderBottom: "1px solid var(--line)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>Settings</span>
            <button className="btn-icon" onClick={onClose}><X size={14} /></button>
          </div>
          <nav style={{ flex: 1, padding: "8px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: "flex", alignItems: "center",
                  padding: "7px 10px", borderRadius: 6,
                  fontSize: 12.5, fontWeight: 500,
                  cursor: "pointer", transition: "80ms",
                  border: "1px solid transparent",
                  background: tab === t.id ? "var(--accent-bg)" : "transparent",
                  color: tab === t.id ? "var(--accent-2)" : "var(--fg-2)",
                  borderColor: tab === t.id ? "var(--accent-line)" : "transparent",
                  fontFamily: "inherit", textAlign: "left", width: "100%",
                }}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
          {tab === "categories" && (
            <div style={{ flex: 1, overflow: "auto" }}>
              <Categories embedded />
            </div>
          )}

          {tab === "price-sources" && (
            <div style={{ padding: 24 }}>
              <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600, color: "var(--fg)" }}>Price Sources</h2>
              <div className="surface" style={{ overflow: "hidden" }}>
                {[
                  { name: "Binance", type: "Crypto", status: "live" },
                  { name: "Yahoo Finance", type: "ETF / Commodity", status: "live" },
                  { name: "Manual input", type: "TEFAS / Custom", status: "manual" },
                ].map((src, i) => (
                  <div key={i} className="table-row" style={{ gridTemplateColumns: "1fr 160px 80px" }}>
                    <span style={{ fontSize: 12.5, color: "var(--fg)" }}>{src.name}</span>
                    <span style={{ fontSize: 12, color: "var(--fg-3)" }}>{src.type}</span>
                    <span className={`pill pill-sm ${src.status === "live" ? "pos-bg" : "info-bg"}`}>
                      {src.status === "live" ? "live" : "manual"}
                    </span>
                  </div>
                ))}
              </div>
              <p style={{ marginTop: 12, fontSize: 11.5, color: "var(--fg-4)" }}>
                {/* TODO: wire to backend price source configuration */}
                Price source configuration coming soon.
              </p>
            </div>
          )}

          {tab === "preferences" && (
            <div style={{ padding: 24 }}>
              <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600, color: "var(--fg)" }}>Preferences</h2>
              <SettingGroup label="Default wallet">
                <div style={{
                  display: "inline-flex", padding: 2,
                  background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 6, gap: 1,
                }}>
                  {(["TRY", "USD"] as const).map((w) => (
                    <button
                      key={w}
                      onClick={() => setWalletView(w)}
                      style={{
                        border: 0, cursor: "pointer",
                        padding: "5px 10px", fontSize: 12,
                        fontWeight: 500, borderRadius: 4,
                        color: walletView === w ? "var(--fg)" : "var(--fg-3)",
                        background: walletView === w ? "var(--bg-3)" : "transparent",
                        transition: "80ms", fontFamily: "inherit",
                      }}
                    >
                      {w === "TRY" ? "₺ TRY" : "$ USD"}
                    </button>
                  ))}
                </div>
              </SettingGroup>
              <SettingGroup label="P&L colors">
                <span style={{ fontSize: 12, color: "var(--fg-3)" }}>Green / Red (fixed) — customisation coming soon</span>
              </SettingGroup>
            </div>
          )}

          {tab === "about" && (
            <div style={{ padding: 24 }}>
              <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600, color: "var(--fg)" }}>About</h2>
              <div className="surface" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "var(--fg-2)" }}>Version</span>
                  <span className="mono" style={{ fontSize: 12, color: "var(--fg)" }}>v{version}</span>
                </div>
                <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
                  {update ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <p style={{ margin: 0, fontSize: 12.5, color: "var(--accent-2)" }}>
                        Update available — v{update.version}
                      </p>
                      <button className="btn btn-primary" onClick={install} disabled={installing} style={{ alignSelf: "flex-start" }}>
                        {installing ? "Installing…" : "Install & Restart"}
                      </button>
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: 12, color: "var(--fg-4)" }}>You're on the latest version.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function SettingGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
        {label}
      </div>
      {children}
    </div>
  );
}
