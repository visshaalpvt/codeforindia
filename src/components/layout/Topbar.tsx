"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn, riskColor, riskBgColor } from "@/lib/utils";
import { getSocket } from "@/lib/socket";
import { useData } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { Bell, ChevronDown, Circle, User } from "lucide-react";

const breadcrumbLabels: Record<string, string> = {
  overview: "Command Overview",
  cases: "Cases Management",
  evidence: "Evidence Upload",
  autopsy: "Autopsy Analysis",
  tod: "TOD Estimation",
  timeline: "Investigation Timeline",
  "crime-map": "Crime Scene Map",
  sensors: "Live IoT Sensors",
  custody: "Chain of Custody",
  anomalies: "Anomaly Detection",
  "ai-summary": "AI Summary",
  chat: "AI Chat",
  notifications: "Alerts & Notifs",
  reports: "Reports & Export",
  "lab-overview": "Lab Overview",
  toxicology: "Toxicology Panel",
  wounds: "Wound Analysis",
  "image-ai": "Evidence Image AI",
  fingerprints: "Fingerprint Vault",
  dna: "DNA & Bio Data",
  entomology: "Entomology Log",
  decomp: "Decomposition Tracker",
  "lab-samples": "Lab Sample Pipeline",
  "intel-overview": "Intelligence Overview",
  "risk-engine": "Risk Score Engine",
  behavioral: "Behavioral Profiler",
  "digital-forensics": "Digital Forensics",
  "cross-case": "Cross-Case Links",
  heatmap: "Evidence Heatmap",
  suspects: "Suspect Tracker",
  witnesses: "Witness Manager",
  "field-reports": "Field Reports",
};

export default function Topbar() {
  const pathname = usePathname();
  const { cases, notifications, activeDashboard, setDashboard } = useData();
  const { user } = useAuth();
  const router = useRouter();
  const [connected, setConnected] = useState(false);
  const [caseSelectorOpen, setCaseSelectorOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState(cases[0]?.id ?? "");
  const unreadCount = notifications.filter((n) => !n.read).length;
  const selectedCase = cases.find((c) => c.id === selectedCaseId);

  const segments = pathname.split("/").filter(Boolean);
  const label = breadcrumbLabels[segments[segments.length - 1] ?? ""] ?? "Dashboard";

  const handleDashboardSwitch = (id: "D1" | "D2" | "D3") => {
    setDashboard(id);
    const path = id === "D1" ? "/d1/overview" : id === "D2" ? "/d2/lab-overview" : "/d3/intel-overview";
    router.push(path);
  };

  useEffect(() => {
    const socket = getSocket();
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on("connected", onConnect);
    socket.on("disconnected", onDisconnect);
    return () => {
      socket.off("connected", onConnect);
      socket.off("disconnected", onDisconnect);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-6 bg-white/80 backdrop-blur-xl border-b border-white/5">
      <div className="flex items-center gap-6">
        <nav className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/select-dashboard" className="hover:text-violet-600 transition-colors font-bold tracking-tighter">
            AIVENTRA
          </Link>
          {segments.length > 0 && (
            <>
              <span className="text-slate-400">/</span>
              <span className="text-slate-900 font-medium">{label}</span>
            </>
          )}
        </nav>

        {/* Dashboard Switcher */}
        <div className="hidden lg:flex items-center bg-slate-50 hover:bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => handleDashboardSwitch("D1")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              activeDashboard === "D1" ? "bg-violet-100 text-violet-600 shadow-[0_0_10px_rgba(6,182,212,0.2)]" : "text-slate-400 hover:text-slate-700"
            )}
          >
            Investigation
          </button>
          <button
            onClick={() => handleDashboardSwitch("D2")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              activeDashboard === "D2" ? "bg-amber-100 text-amber-600 shadow-[0_0_10px_rgba(245,158,11,0.2)]" : "text-slate-400 hover:text-slate-700"
            )}
          >
            Forensic Lab
          </button>
          <button
            onClick={() => handleDashboardSwitch("D3")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              activeDashboard === "D3" ? "bg-violet-100 text-violet-600 shadow-[0_0_10px_rgba(139,92,246,0.2)]" : "text-slate-400 hover:text-slate-700"
            )}
          >
            Intelligence
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setCaseSelectorOpen(!caseSelectorOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-sm text-slate-700 hover:border-slate-300 transition-colors"
          >
            <span className="truncate max-w-32">{selectedCase?.id ?? "Select Case"}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
          {caseSelectorOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-2xl overflow-hidden z-50">
              {cases.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedCaseId(c.id); setCaseSelectorOpen(false); }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 hover:bg-slate-100 transition-colors",
                    c.id === selectedCaseId ? "bg-violet-50 text-violet-600" : "text-slate-700"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{c.id}</span>
                    <span className="text-xs text-slate-400">{c.priority}</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{c.title}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs">
          <Circle
            className={cn(
              "w-2 h-2 fill-current",
              connected ? "text-green-600 animate-pulse" : "text-red-600"
            )}
          />
          <span className={cn(connected ? "text-green-600" : "text-red-600")}>
            {connected ? "Live" : "Offline"}
          </span>
        </div>

        <Link
          href="/notifications"
          className="relative p-2 rounded-lg hover:bg-slate-50 hover:bg-slate-100 transition-colors"
        >
          <Bell className="w-5 h-5 text-slate-500" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-red-500 text-slate-900 text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        {selectedCase && (
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border",
            riskBgColor(selectedCase.riskScore),
            riskColor(selectedCase.riskScore)
          )}>
            <span>RISK {selectedCase.riskScore}</span>
          </div>
        )}

          <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-br",
              activeDashboard === "D1" ? "from-cyan-400 to-blue-600" :
              activeDashboard === "D2" ? "from-amber-400 to-orange-600" :
              "from-purple-400 to-indigo-600"
            )}>
              <User className="w-3.5 h-3.5 text-slate-900" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm text-slate-900 leading-tight">{user?.name ?? "Guest"}</p>
              <p className={cn("text-[10px] leading-tight", 
                activeDashboard === "D1" ? "text-violet-600" : 
                activeDashboard === "D2" ? "text-amber-600" : "text-violet-600"
              )}>{user?.role ?? "—"}</p>
            </div>
          </div>
      </div>
    </header>
  );
}
