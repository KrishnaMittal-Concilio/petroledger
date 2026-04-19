import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../../store/auth";
import { logoutRequest } from "../../api/auth";
import { useState } from "react";
import { OrgSelector } from "./OrgSelector";

export interface NavItem {
  to: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export type PortalTheme = "provider" | "admin" | "manager" | "worker";

/**
 * Per-portal theme tokens — see AGENT_FIX_PROMPT §295-300.
 *
 *   provider : indigo     (#1e1b4b → #312e81 sidebar, #6366f1 accent)
 *   admin    : emerald    (#064e3b → #065f46 sidebar, #10b981 accent)
 *   manager  : blue       (#1e3a5f → #1e40af sidebar, #3b82f6 accent)
 *   worker   : slate-gray (#111827 → #1f2937 sidebar, #f59e0b accent)
 */
const THEME_TOKENS: Record<
  PortalTheme,
  {
    sidebar: string;
    activeBg: string;
    activeText: string;
    accentDot: string;
    badgeBg: string;
    badgeText: string;
    brand: string;
  }
> = {
  provider: {
    sidebar:
      "bg-gradient-to-b from-[#1e1b4b] to-[#312e81] text-indigo-50 border-indigo-900/40",
    activeBg: "bg-indigo-500/20",
    activeText: "text-white",
    accentDot: "bg-indigo-400",
    badgeBg: "bg-indigo-300",
    badgeText: "text-indigo-950",
    brand: "text-indigo-300",
  },
  admin: {
    sidebar:
      "bg-gradient-to-b from-[#064e3b] to-[#065f46] text-emerald-50 border-emerald-900/40",
    activeBg: "bg-emerald-500/20",
    activeText: "text-white",
    accentDot: "bg-emerald-400",
    badgeBg: "bg-emerald-300",
    badgeText: "text-emerald-950",
    brand: "text-emerald-300",
  },
  manager: {
    sidebar:
      "bg-gradient-to-b from-[#1e3a5f] to-[#1e40af] text-blue-50 border-blue-900/40",
    activeBg: "bg-blue-500/25",
    activeText: "text-white",
    accentDot: "bg-blue-400",
    badgeBg: "bg-blue-300",
    badgeText: "text-blue-950",
    brand: "text-blue-300",
  },
  worker: {
    sidebar:
      "bg-gradient-to-b from-[#111827] to-[#1f2937] text-slate-100 border-slate-800",
    activeBg: "bg-amber-500/20",
    activeText: "text-white",
    accentDot: "bg-amber-400",
    badgeBg: "bg-amber-300",
    badgeText: "text-slate-950",
    brand: "text-amber-300",
  },
};

export interface PortalLayoutProps {
  title: string;
  nav: NavItem[];
  /**
   * Which palette to apply to the sidebar / accents. Defaults to `admin`
   * so legacy call sites without a theme still render cleanly.
   */
  theme?: PortalTheme;
}

export function PortalLayout({
  title,
  nav,
  theme = "admin",
}: PortalLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const tokens = THEME_TOKENS[theme];

  async function handleLogout() {
    await logoutRequest();
    logout();
    navigate("/login", { replace: true });
  }

  function closeMobile() {
    setOpen(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        {/* Mobile backdrop */}
        {open && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={closeMobile}
            className="fixed inset-0 z-20 bg-black/40 md:hidden"
          />
        )}

        <aside
          className={`${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:static z-30 inset-y-0 left-0 w-60 flex flex-col border-r transition-transform duration-200 ${tokens.sidebar}`}
        >
          <div className="px-5 py-5 flex items-center justify-between border-b border-white/10">
            <div>
              <div className="text-lg font-bold tracking-tight text-white">
                Petro<span className={tokens.brand}>Ledger</span>
              </div>
              <div className="text-[11px] uppercase tracking-wider opacity-70 mt-0.5">
                {title}
              </div>
            </div>
            <button
              type="button"
              className="md:hidden text-white/80 hover:text-white"
              onClick={closeMobile}
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end
                  onClick={closeMobile}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                      isActive
                        ? `${tokens.activeBg} ${tokens.activeText} shadow-sm`
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`
                  }
                >
                  {Icon && <Icon className="h-4 w-4 shrink-0" />}
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && item.badge > 0 ? (
                    <span
                      className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full ${tokens.badgeBg} ${tokens.badgeText} text-[10px] font-mono font-bold`}
                    >
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  ) : null}
                </NavLink>
              );
            })}
          </nav>

          <div className="border-t border-white/10 px-4 py-4 text-xs">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${tokens.accentDot}`} />
              <div className="flex-1 min-w-0">
                <div className="truncate font-medium text-white">
                  {user?.email ?? "—"}
                </div>
                <div className="opacity-60 uppercase tracking-wider text-[10px]">
                  {user?.role ?? ""}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-3 inline-flex items-center gap-2 text-white/70 hover:text-white transition"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 md:ml-0">
          <header className="sticky top-0 z-10 h-16 flex items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="md:hidden text-slate-700"
                onClick={() => setOpen(true)}
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </button>
              {(user?.role === "owner" || user?.role === "admin") && (
                <OrgSelector />
              )}
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="hidden sm:inline text-slate-500">
                Signed in as{" "}
                <span className="text-slate-900 font-medium">
                  {user?.email}
                </span>
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-600">
                {user?.role}
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </header>

          <main className="flex-1 p-6 md:p-8">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
