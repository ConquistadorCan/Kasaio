import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { getVersion } from "@tauri-apps/api/app";
import logoNobg from "../../assets/logo-nobg.png";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tag,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Wallet,
  PanelLeftClose,
  PanelLeftOpen,
  BarChart2,
  Gem,
  Bitcoin,
  Receipt,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

interface TopLevelNav {
  id: string;
  label: string;
  icon: LucideIcon;
  enabled: boolean;
  path?: string;
  items?: NavItem[];
}

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

const NAV_ITEMS: TopLevelNav[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    enabled: true,
    path: "/dashboard",
  },
  {
    id: "cash-flow",
    label: "Cash Flow",
    icon: Wallet,
    enabled: true,
    items: [
      { label: "Transactions", path: "/cash-flow/transactions", icon: ArrowLeftRight },
      { label: "Categories", path: "/cash-flow/categories", icon: Tag },
    ],
  },
  {
    id: "investments",
    label: "Investments",
    icon: TrendingUp,
    enabled: true,
    items: [
      { label: "Portfolio", path: "/investments/portfolio", icon: BarChart2 },
      { label: "Commodities", path: "/investments/commodities", icon: Gem },
      { label: "Cryptocurrencies", path: "/investments/crypto", icon: Bitcoin },
      { label: "Transactions", path: "/investments/transactions", icon: Receipt },
      { label: "Price Update", path: "/investments/price-update", icon: RefreshCw },
    ],
  },
];

export function Sidebar({ open, onToggle }: SidebarProps) {
  const [openGroups, setOpenGroups] = useState<string[]>(["cash-flow", "investments"]);
  const [version, setVersion] = useState<string>("");

  useEffect(() => {
    getVersion().then(setVersion);
  }, []);

  function toggleGroup(id: string) {
    setOpenGroups((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  }

  return (
    <aside
      className={cn(
        "shrink-0 flex flex-col h-full bg-[#0d0d14] border-r border-white/5 overflow-hidden transition-all duration-300 ease-in-out",
        open ? "w-56" : "w-12"
      )}
    >
      {/* Header */}
      <div className="px-3 py-4 border-b border-white/5 flex items-center justify-between min-w-0">
        <div className={cn(
          "flex items-center gap-2 transition-all duration-300 overflow-hidden",
          open ? "opacity-100 w-auto" : "opacity-0 w-0"
        )}>
          <img src={logoNobg} alt="Kasaio" className="w-6 h-6 shrink-0 object-contain" />
          <span className="text-lg font-semibold tracking-tight text-white whitespace-nowrap">
            kasa<span className="text-violet-400">io</span>
          </span>
        </div>
        <button
          onClick={onToggle}
          className="shrink-0 p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-colors"
        >
          {open ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-1.5 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isOpen = openGroups.includes(item.id);

          if (item.path) {
            return (
              <NavLink
                key={item.id}
                to={item.path}
                title={!open ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-violet-500/15 text-violet-300"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )
                }
              >
                <Icon size={15} className="shrink-0" />
                <span
                  className={cn(
                    "overflow-hidden whitespace-nowrap transition-all duration-300",
                    open ? "opacity-100 w-auto" : "opacity-0 w-0"
                  )}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          }

          return (
            <div key={item.id}>
              <button
                onClick={() => item.enabled && (open ? toggleGroup(item.id) : null)}
                disabled={!item.enabled}
                title={!open ? item.label : undefined}
                className={cn(
                  "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors",
                  item.enabled
                    ? "text-white/60 hover:text-white hover:bg-white/5 cursor-pointer"
                    : "text-white/20 cursor-not-allowed"
                )}
              >
                <Icon size={15} className="shrink-0" />
                <span
                  className={cn(
                    "flex-1 text-left overflow-hidden whitespace-nowrap transition-all duration-300",
                    open ? "opacity-100 w-auto" : "opacity-0 w-0"
                  )}
                >
                  {item.label}
                </span>
                {open && item.enabled && (
                  isOpen ? <ChevronDown size={13} className="shrink-0" /> : <ChevronRight size={13} className="shrink-0" />
                )}
                {open && !item.enabled && (
                  <span className="text-[10px] bg-white/5 text-white/25 px-1.5 py-0.5 rounded-full shrink-0">
                    soon
                  </span>
                )}
              </button>

              {open && item.enabled && isOpen && item.items && (
                <div
                  className="mt-0.5 flex flex-col gap-0.5 border-l border-white/5"
                  style={{ marginLeft: "0.75rem", paddingLeft: "0.5rem" }}
                >
                  {item.items.map((sub) => {
                    const SubIcon = sub.icon;
                    return (
                      <NavLink
                        key={sub.path}
                        to={sub.path}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors",
                            isActive
                              ? "bg-violet-500/15 text-violet-300 font-medium"
                              : "text-white/50 hover:text-white/80 hover:bg-white/5"
                          )
                        }
                      >
                        <SubIcon size={14} className="shrink-0" />
                        {sub.label}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/5">
        <span
          className={cn(
            "text-xs text-white/20 overflow-hidden whitespace-nowrap transition-all duration-300",
            open ? "opacity-100" : "opacity-0"
          )}
        >
          v{version}
        </span>
      </div>
    </aside>
  );
}