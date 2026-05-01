import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, ArrowLeftRight, Sparkles,
  BarChart2, Landmark, ShieldCheck, Settings,
  PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { useUIStore } from "../../store/useUIStore";

const NAV = [
  { kind: "item" as const, label: "Dashboard", path: "/dashboard", Icon: LayoutDashboard },
  {
    kind: "group" as const, label: "Activity", items: [
      { label: "Transactions", path: "/cash-flow/transactions", Icon: ArrowLeftRight },
      { label: "Insights",     path: "/insights",               Icon: Sparkles },
    ],
  },
  {
    kind: "group" as const, label: "Portfolio", items: [
      { label: "Holdings", path: "/investments/portfolio", Icon: BarChart2 },
      { label: "Bonds",    path: "/investments/eurobond",  Icon: Landmark },
      { label: "Pension",  path: "/investments/bes",       Icon: ShieldCheck },
    ],
  },
];

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen, walletView, setWalletView, setSettingsOpen } = useUIStore();
  const open = sidebarOpen;
  const W = open ? 220 : 56;

  const itemBase: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 10,
    padding: open ? "6px 10px" : "8px 0",
    justifyContent: open ? "flex-start" : "center",
    borderRadius: 6, fontSize: 12.5, fontWeight: 500,
    cursor: "pointer", userSelect: "none", transition: "80ms",
    border: "1px solid transparent",
    background: "transparent",
    color: "var(--fg-2)",
    fontFamily: "inherit",
    width: "100%", textAlign: "left",
  };

  return (
    <aside style={{
      width: W, flexShrink: 0, height: "100%",
      background: "var(--bg-0)",
      borderRight: "1px solid var(--line)",
      display: "flex", flexDirection: "column",
      transition: "width 200ms ease",
      overflow: "hidden",
      position: "relative", zIndex: 5,
    }}>
      {/* Brand + collapse */}
      <div style={{
        height: 48,
        padding: open ? "0 8px 0 14px" : "0",
        display: "flex", alignItems: "center",
        justifyContent: open ? "space-between" : "center",
        borderBottom: "1px solid var(--line)",
        flexShrink: 0,
      }}>
        {open ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <BrandMark />
              <span style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: "-0.015em", whiteSpace: "nowrap" }}>
                Kasa<span style={{ color: "var(--accent-2)" }}>io</span>
              </span>
            </div>
            <button
              className="btn-icon"
              onClick={() => setSidebarOpen(false)}
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose size={14} />
            </button>
          </>
        ) : (
          <button
            className="btn-icon"
            onClick={() => setSidebarOpen(true)}
            aria-label="Expand sidebar"
            style={{ padding: 0, width: 30, height: 30, justifyContent: "center" }}
          >
            <BrandMark />
          </button>
        )}
      </div>

      {/* Wallet selector */}
      {open ? (
        <div style={{ padding: "12px 10px 8px", flexShrink: 0 }}>
          <div className="mono" style={{
            fontSize: 9.5, color: "var(--fg-4)",
            textTransform: "uppercase", letterSpacing: "0.08em",
            padding: "0 4px 6px",
          }}>
            Account
          </div>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4,
            padding: 2,
            background: "var(--bg-1)",
            border: "1px solid var(--line)",
            borderRadius: 6,
          }}>
            {(["TRY", "USD"] as const).map((w) => (
              <button
                key={w}
                onClick={() => setWalletView(w)}
                style={{
                  border: 0, cursor: "pointer", padding: "5px 0",
                  fontSize: 11.5, fontWeight: 600, borderRadius: 4,
                  color: walletView === w ? "var(--fg)" : "var(--fg-3)",
                  background: walletView === w ? "var(--bg-3)" : "transparent",
                  fontFamily: "inherit",
                  transition: "80ms",
                }}
              >
                <span className="mono" style={{ marginRight: 4 }}>{w === "TRY" ? "₺" : "$"}</span>{w}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ padding: "12px 0", display: "flex", justifyContent: "center", flexShrink: 0 }}>
          <button
            onClick={() => setWalletView(walletView === "TRY" ? "USD" : "TRY")}
            title={`Switch to ${walletView === "TRY" ? "USD" : "TRY"}`}
            className="mono"
            style={{
              fontSize: 11, fontWeight: 600,
              width: 30, height: 22, borderRadius: 4,
              background: "var(--bg-2)", border: "1px solid var(--line)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--accent-2)", cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {walletView === "TRY" ? "₺" : "$"}
          </button>
        </div>
      )}

      {/* Nav */}
      <nav style={{
        flex: 1, overflowY: "auto", overflowX: "hidden",
        padding: "4px 6px 12px",
        display: "flex", flexDirection: "column", gap: 1,
      }}>
        {NAV.map((item, idx) => {
          if (item.kind === "item") {
            const { Icon, label, path } = item;
            return (
              <NavLink
                key={path}
                to={path}
                title={!open ? label : undefined}
                style={({ isActive }) => ({
                  ...itemBase,
                  background: isActive ? "var(--accent-bg)" : "transparent",
                  color: isActive ? "var(--accent-2)" : "var(--fg-2)",
                  borderColor: isActive ? "var(--accent-line)" : "transparent",
                  textDecoration: "none",
                })}
              >
                <Icon size={15} style={{ flexShrink: 0 }} />
                {open && <span style={{ whiteSpace: "nowrap" }}>{label}</span>}
              </NavLink>
            );
          }

          return (
            <div key={idx} style={{ marginTop: 10 }}>
              {open ? (
                <div className="mono" style={{
                  fontSize: 9, color: "var(--fg-5)",
                  textTransform: "uppercase", letterSpacing: "0.12em",
                  padding: "4px 12px 6px",
                }}>
                  {item.label}
                </div>
              ) : (
                <div style={{ height: 1, background: "var(--line)", margin: "8px 12px" }} />
              )}
              {item.items.map(({ label, path, Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  title={!open ? label : undefined}
                  style={({ isActive }) => ({
                    ...itemBase,
                    background: isActive ? "var(--accent-bg)" : "transparent",
                    color: isActive ? "var(--accent-2)" : "var(--fg-2)",
                    borderColor: isActive ? "var(--accent-line)" : "transparent",
                    textDecoration: "none",
                  })}
                >
                  <Icon size={14} style={{ flexShrink: 0 }} />
                  {open && <span style={{ whiteSpace: "nowrap" }}>{label}</span>}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding: "8px",
        borderTop: "1px solid var(--line)",
        display: "flex", alignItems: "center", gap: 6,
        flexShrink: 0,
      }}>
        {open ? (
          <>
            <button
              onClick={() => setSettingsOpen(true)}
              style={{
                ...itemBase, flex: 1,
                color: "var(--fg-3)", padding: "6px 10px",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-2)"; e.currentTarget.style.color = "var(--fg)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--fg-3)"; }}
            >
              <Settings size={14} />
              <span>Settings</span>
            </button>
            <span style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 6px" }}>
              <span className="dot" style={{ background: "var(--success)" }} />
            </span>
          </>
        ) : (
          <button
            className="btn-icon"
            onClick={() => setSettingsOpen(true)}
            title="Settings"
            style={{ margin: "0 auto" }}
          >
            <Settings size={14} />
          </button>
        )}
      </div>
    </aside>
  );
}

function BrandMark() {
  return (
    <div style={{
      width: 22, height: 22, borderRadius: 5,
      background: "linear-gradient(140deg, var(--accent) 0%, oklch(0.55 0.16 240) 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 700, color: "oklch(0.15 0.02 250)",
      flexShrink: 0,
    }}>
      K
    </div>
  );
}
