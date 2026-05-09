"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/store";
import { getModulesForDashboard } from "@/lib/module-config";
import {
  ChevronLeft, ChevronRight, LogOut, User, Settings,
} from "lucide-react";
import { useMemo } from "react";

export default function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { activeDashboard, enabledModules } = useData();

  const accentClass = activeDashboard === "D1" ? "text-violet-600" : activeDashboard === "D2" ? "text-amber-600" : "text-violet-600";
  const accentBg = activeDashboard === "D1" ? "bg-violet-50" : activeDashboard === "D2" ? "bg-amber-50" : "bg-violet-50";
  const accentBorder = activeDashboard === "D1" ? "border-cyan-400" : activeDashboard === "D2" ? "border-amber-400" : "border-purple-400";
  const logoBorder = activeDashboard === "D1" ? "border-slate-400" : activeDashboard === "D2" ? "border-amber-500/50" : "border-purple-500/50";
  const settingsHref = activeDashboard === "D1" ? "/d1/settings" : activeDashboard === "D2" ? "/d2/settings" : "/d3/settings";

  // Get all modules for the active dashboard
  const allModules = useMemo(() => getModulesForDashboard(activeDashboard), [activeDashboard]);

  // Filter: show core modules always, optional only when enabled
  const visibleItems = useMemo(() => {
    return allModules.filter(m => m.isCore || enabledModules[m.key]);
  }, [allModules, enabledModules]);

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-full z-50 flex flex-col bg-white/95 backdrop-blur border-r border-white/5 transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border", accentBg, logoBorder)}>
              <span className={cn("font-bold text-sm", accentClass)}>AI</span>
            </div>
            <span className={cn("font-bold font-['Space_Grotesk'] tracking-wider", accentClass)}>AIVENTRA</span>
          </div>
        )}
        {collapsed && (
          <div className="w-full flex justify-center">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border", accentBg, logoBorder)}>
              <span className={cn("font-bold text-sm", accentClass)}>AI</span>
            </div>
          </div>
        )}
      </div>

      {/* Dashboard Label */}
      {!collapsed && (
        <div className="px-6 py-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            {activeDashboard === "D1" ? "Investigation Command" : activeDashboard === "D2" ? "Forensic Science Lab" : "Intelligence Analytics"}
          </p>
        </div>
      )}

      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto py-2 px-2 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {visibleItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <motion.div
                key={item.key}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10, height: 0, marginTop: 0, marginBottom: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 my-1 rounded-xl transition-all duration-200 group relative",
                    active
                      ? cn(accentBg, "border-l-2", accentBorder, accentClass)
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 hover:bg-slate-100"
                  )}
                  title={item.label}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!collapsed && (
                    <div className="flex items-center justify-between flex-1">
                      <span className="text-sm whitespace-nowrap">{item.label}</span>
                      {!item.isCore && (
                        <span className={cn("text-[7px] font-bold px-1.5 py-0.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200", accentClass)}>
                          OPT
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Settings Link — always at the bottom of nav */}
        <div className="mt-2 pt-2 border-t border-white/5">
          <Link
            href={settingsHref}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 my-1 rounded-xl transition-all duration-200",
              pathname === settingsHref
                ? cn(accentBg, "border-l-2", accentBorder, accentClass)
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 hover:bg-slate-100"
            )}
            title="Settings"
          >
            <Settings className="w-5 h-5 shrink-0" />
            {!collapsed && (
              <div className="flex items-center justify-between flex-1">
                <span className="text-sm whitespace-nowrap">Settings</span>
                <span className={cn("text-[7px]", accentClass)}>⚙️</span>
              </div>
            )}
          </Link>
        </div>
      </div>

      {/* User Profile */}
      <div className="border-t border-white/5 p-3">
        {!collapsed ? (
          <div className="flex items-center gap-3 px-2 py-2">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br",
              activeDashboard === "D1" ? "from-cyan-400 to-blue-600" :
              activeDashboard === "D2" ? "from-amber-400 to-orange-600" :
              "from-purple-400 to-indigo-600"
            )}>
              <User className="w-4 h-4 text-slate-900" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-900 truncate">{user?.name ?? "Guest"}</p>
              <p className={cn("text-xs", accentClass)}>{user?.role ?? "—"}</p>
            </div>
            <LogOut onClick={logout} className="w-4 h-4 text-slate-400 hover:text-red-600 cursor-pointer transition-colors" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br",
              activeDashboard === "D1" ? "from-cyan-400 to-blue-600" :
              activeDashboard === "D2" ? "from-amber-400 to-orange-600" :
              "from-purple-400 to-indigo-600"
            )}>
              <User className="w-4 h-4 text-slate-900" />
            </div>
            <LogOut onClick={logout} className="w-4 h-4 text-slate-400 hover:text-red-600 cursor-pointer transition-colors" />
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className={cn(
          "absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border flex items-center justify-center transition-all",
          accentBorder, accentClass, "hover:scale-110"
        )}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
