import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tag,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Wallet,
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
    enabled: false,
    items: [],
  },
];

export function Sidebar() {
  const [openGroups, setOpenGroups] = useState<string[]>(["cash-flow"]);

  function toggleGroup(id: string) {
    setOpenGroups((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  }

  return (
    <aside className="w-56 shrink-0 flex flex-col h-full bg-[#0d0d14] border-r border-white/5">
      <div className="px-5 py-5 border-b border-white/5">
        <span className="text-lg font-semibold tracking-tight text-white">
          kasa<span className="text-violet-400">io</span>
        </span>
      </div>

      <nav className="flex-1 py-4 px-3 flex flex-col gap-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isOpen = openGroups.includes(item.id);

          if (item.path) {
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-violet-500/15 text-violet-300"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )
                }
              >
                <Icon size={15} />
                {item.label}
              </NavLink>
            );
          }

          return (
            <div key={item.id}>
              <button
                onClick={() => item.enabled && toggleGroup(item.id)}
                disabled={!item.enabled}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  item.enabled
                    ? "text-white/60 hover:text-white hover:bg-white/5 cursor-pointer"
                    : "text-white/20 cursor-not-allowed"
                )}
              >
                <Icon size={15} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.enabled && (
                  isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />
                )}
                {!item.enabled && (
                  <span className="text-[10px] bg-white/5 text-white/25 px-1.5 py-0.5 rounded-full">
                    soon
                  </span>
                )}
              </button>

              {item.enabled && isOpen && item.items && (
                <div className="mt-0.5 ml-3 flex flex-col gap-0.5 border-l border-white/5 pl-3">
                  {item.items.map((sub) => {
                    const SubIcon = sub.icon;
                    return (
                      <NavLink
                        key={sub.path}
                        to={sub.path}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                            isActive
                              ? "bg-violet-500/15 text-violet-300 font-medium"
                              : "text-white/50 hover:text-white/80 hover:bg-white/5"
                          )
                        }
                      >
                        <SubIcon size={14} />
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

      <div className="px-5 py-4 border-t border-white/5">
        <p className="text-xs text-white/20">v0.1.0</p>
      </div>
    </aside>
  );
}