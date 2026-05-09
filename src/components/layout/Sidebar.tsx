"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, FolderKanban, Upload, Microscope, Clock, CalendarDays,
  Share2, Map, Radio, ShieldCheck, AlertTriangle, Bot, MessageSquare,
  Bell, FileText, ChevronLeft, ChevronRight, LogOut, User, Activity, Bug,
} from "lucide-react";

const d1Items = [
  { href: "/d1/overview", label: "Command Overview", icon: LayoutDashboard },
  { href: "/d1/cases", label: "Cases Management", icon: FolderKanban },
  { href: "/d1/evidence", label: "Evidence Upload", icon: Upload },
  { href: "/d1/timeline", label: "Investigation Timeline", icon: CalendarDays },
  { href: "/d1/crime-map", label: "Crime Scene Map", icon: Map },
  { href: "/d1/sensors", label: "Live IoT Sensors", icon: Radio },
  { href: "/d1/custody", label: "Chain of Custody", icon: ShieldCheck },
  { href: "/d1/notifications", label: "Alerts & Notifs", icon: Bell },
  { href: "/d1/suspects", label: "Suspect Tracker", icon: User },
  { href: "/d1/witnesses", label: "Witness Manager", icon: User },
  { href: "/d1/field-reports", label: "Field Reports", icon: FileText },
];

const d2Items = [
  { href: "/d2/lab-overview", label: "Lab Overview", icon: LayoutDashboard },
  { href: "/d2/autopsy", label: "Autopsy Analysis", icon: Microscope },
  { href: "/d2/tod", label: "TOD Estimation", icon: Clock },
  { href: "/d2/toxicology", label: "Toxicology Panel", icon: Microscope },
  { href: "/d2/wounds", label: "Wound Analysis", icon: Activity },
  { href: "/d2/image-ai", label: "Evidence Image AI", icon: Bot },
  { href: "/d2/fingerprints", label: "Fingerprint Vault", icon: ShieldCheck },
  { href: "/d2/dna", label: "DNA & Bio Data", icon: Activity },
  { href: "/d2/entomology", label: "Entomology Log", icon: Bug },
  { href: "/d2/decomp", label: "Decomp Tracker", icon: Clock },
  { href: "/d2/lab-samples", label: "Lab Sample Pipeline", icon: Share2 },
];

const d3Items = [
  { href: "/d3/intel-overview", label: "Intelligence Overview", icon: LayoutDashboard },
  { href: "/d3/anomalies", label: "Anomaly Detection", icon: AlertTriangle },
  { href: "/d3/correlation", label: "Correlation Graph", icon: Share2 },
  { href: "/d3/ai-summary", label: "AI Case Summary", icon: Bot },
  { href: "/d3/chat", label: "AI Chat", icon: MessageSquare },
  { href: "/d3/reports", label: "Reports & Export", icon: FileText },
  { href: "/d3/risk-engine", label: "Risk Score Engine", icon: Activity },
  { href: "/d3/behavioral", label: "Behavioral Profiler", icon: User },
  { href: "/d3/digital-forensics", label: "Digital Forensics", icon: Radio },
  { href: "/d3/cross-case", label: "Cross-Case Links", icon: Share2 },
  { href: "/d3/heatmap", label: "Evidence Heatmap", icon: Map },
];

import { useData } from "@/lib/store";

export default function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { activeDashboard } = useData();

  const navItems = activeDashboard === "D1" ? d1Items : activeDashboard === "D2" ? d2Items : d3Items;
  const accentColor = activeDashboard === "D1" ? "cyan" : activeDashboard === "D2" ? "amber" : "purple";
  const accentHex = activeDashboard === "D1" ? "#00F5FF" : activeDashboard === "D2" ? "#F59E0B" : "#8B5CF6";
  const accentClass = activeDashboard === "D1" ? "text-cyan-400" : activeDashboard === "D2" ? "text-amber-400" : "text-purple-400";
  const accentBg = activeDashboard === "D1" ? "bg-cyan-500/10" : activeDashboard === "D2" ? "bg-amber-500/10" : "bg-purple-500/10";
  const accentBorder = activeDashboard === "D1" ? "border-cyan-400" : activeDashboard === "D2" ? "border-amber-400" : "border-purple-400";
  const logoBorder = activeDashboard === "D1" ? "border-cyan-500/50" : activeDashboard === "D2" ? "border-amber-500/50" : "border-purple-500/50";

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-full z-50 flex flex-col bg-[#0B1020]/95 backdrop-blur border-r border-white/5 transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
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
      
      {!collapsed && (
        <div className="px-6 py-4">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
            {activeDashboard === "D1" ? "Investigation Command" : activeDashboard === "D2" ? "Forensic Science Lab" : "Intelligence Analytics"}
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-2 px-2 custom-scrollbar">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 my-1 rounded-xl transition-all duration-200 group relative",
                active
                  ? cn(accentBg, "border-l-2", accentBorder, accentClass)
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
              title={item.label}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && (
                <div className="flex items-center justify-between flex-1">
                  <span className="text-sm whitespace-nowrap">{item.label}</span>
                  {(item as any).isNew && (
                    <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 border border-white/20", accentClass)}>
                      NEW
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>
      <div className="border-t border-white/5 p-3">
        {!collapsed ? (
          <div className="flex items-center gap-3 px-2 py-2">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br", 
              activeDashboard === "D1" ? "from-cyan-400 to-blue-600" : 
              activeDashboard === "D2" ? "from-amber-400 to-orange-600" : 
              "from-purple-400 to-indigo-600"
            )}>
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{user?.name ?? "Guest"}</p>
              <p className={cn("text-xs", accentClass)}>{user?.role ?? "—"}</p>
            </div>
            <LogOut onClick={logout} className="w-4 h-4 text-gray-500 hover:text-red-400 cursor-pointer transition-colors" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br",
              activeDashboard === "D1" ? "from-cyan-400 to-blue-600" : 
              activeDashboard === "D2" ? "from-amber-400 to-orange-600" : 
              "from-purple-400 to-indigo-600"
            )}>
              <User className="w-4 h-4 text-white" />
            </div>
            <LogOut onClick={logout} className="w-4 h-4 text-gray-500 hover:text-red-400 cursor-pointer transition-colors" />
          </div>
        )}
      </div>
      <button
        onClick={onToggle}
        className={cn(
          "absolute -right-3 top-20 w-6 h-6 rounded-full bg-[#0B1020] border flex items-center justify-center transition-all",
          accentBorder, accentClass, "hover:scale-110"
        )}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
