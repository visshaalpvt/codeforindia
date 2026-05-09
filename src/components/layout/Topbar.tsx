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
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-6 bg-[#0B1020]/80 backdrop-blur-xl border-b border-white/5">
      <div className="flex items-center gap-6">
        <nav className="flex items-center gap-2 text-sm text-gray-400">
          <Link href="/select-dashboard" className="hover:text-cyan-400 transition-colors font-bold tracking-tighter">
            AIVENTRA
          </Link>
          {segments.length > 0 && (
            <>
              <span className="text-gray-600">/</span>
              <span className="text-white font-medium">{label}</span>
            </>
          )}
        </nav>

        {/* Dashboard Switcher */}
        <div className="hidden lg:flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => handleDashboardSwitch("D1")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              activeDashboard === "D1" ? "bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]" : "text-gray-500 hover:text-gray-300"
            )}
          >
            Investigation
          </button>
          <button
            onClick={() => handleDashboardSwitch("D2")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              activeDashboard === "D2" ? "bg-amber-500/20 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]" : "text-gray-500 hover:text-gray-300"
            )}
          >
            Forensic Lab
          </button>
          <button
            onClick={() => handleDashboardSwitch("D3")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              activeDashboard === "D3" ? "bg-purple-500/20 text-purple-400 shadow-[0_0_10px_rgba(139,92,246,0.2)]" : "text-gray-500 hover:text-gray-300"
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
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:border-cyan-500/30 transition-colors"
          >
            <span className="truncate max-w-32">{selectedCase?.id ?? "Select Case"}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
          </button>
          {caseSelectorOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-[#111827] border border-white/10 shadow-2xl overflow-hidden z-50">
              {cases.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedCaseId(c.id); setCaseSelectorOpen(false); }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors",
                    c.id === selectedCaseId ? "bg-cyan-500/10 text-cyan-400" : "text-gray-300"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{c.id}</span>
                    <span className="text-xs text-gray-500">{c.priority}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{c.title}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs">
          <Circle
            className={cn(
              "w-2 h-2 fill-current",
              connected ? "text-green-400 animate-pulse" : "text-red-400"
            )}
          />
          <span className={cn(connected ? "text-green-400" : "text-red-400")}>
            {connected ? "Live" : "Offline"}
          </span>
        </div>

        <Link
          href="/notifications"
          className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <Bell className="w-5 h-5 text-gray-400" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
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

          <div className="flex items-center gap-2 pl-3 border-l border-white/10">
            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-br",
              activeDashboard === "D1" ? "from-cyan-400 to-blue-600" :
              activeDashboard === "D2" ? "from-amber-400 to-orange-600" :
              "from-purple-400 to-indigo-600"
            )}>
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm text-white leading-tight">{user?.name ?? "Guest"}</p>
              <p className={cn("text-[10px] leading-tight", 
                activeDashboard === "D1" ? "text-cyan-400" : 
                activeDashboard === "D2" ? "text-amber-400" : "text-purple-400"
              )}>{user?.role ?? "—"}</p>
            </div>
          </div>
      </div>
    </header>
  );
}
