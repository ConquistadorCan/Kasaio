import { useLocation } from "react-router-dom";

const ROUTE_META: Record<string, string> = {
  "/dashboard":                      "Dashboard",
  "/cash-flow/transactions":         "Activity / Transactions",
  "/cash-flow/categories":           "Activity / Categories",
  "/insights":                       "Activity / Insights",
  "/investments/portfolio":          "Portfolio / Holdings",
  "/investments/commodities":        "Portfolio / Holdings · Commodities",
  "/investments/crypto":             "Portfolio / Holdings · Crypto",
  "/investments/tefas-funds":        "Portfolio / Holdings · TEFAS",
  "/investments/etf":                "Portfolio / Holdings · ETFs",
  "/investments/eurobond":           "Portfolio / Bonds",
  "/investments/bes":                "Portfolio / Pension",
  "/investments/transactions":       "Portfolio / Transactions",
  "/investments/price-update":       "Portfolio / Price Update",
};

export function TopBar() {
  const { pathname } = useLocation();
  const label = ROUTE_META[pathname] ?? pathname.replace(/^\//, "");

  return (
    <div style={{
      height: 48,
      flexShrink: 0,
      padding: "0 18px",
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-start",
      borderBottom: "1px solid var(--line)",
      background: "var(--bg-1)",
      position: "relative",
      zIndex: 2,
    }}>
      {/* Breadcrumb */}
      <span className="mono" style={{
        fontSize: 10.5,
        color: "var(--fg-4)",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
      }}>
        {label}
      </span>

    </div>
  );
}
