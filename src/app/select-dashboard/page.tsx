"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Microscope, Brain, ArrowRight, Activity, Zap, AlertCircle } from "lucide-react";
import { useData } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const dashboards = [
  {
    id: "D1",
    title: "Investigation Command",
    description: "Field operations, evidence management, and real-time situational awareness.",
    icon: Shield,
    color: "cyan",
    accent: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-slate-200",
    glow: "shadow-[0_0_20px_rgba(6,182,212,0.15)]",
    modules: "11 Modules",
    tags: ["Field Ops", "Evidence", "Real-time"],
    path: "/d1/overview",
  },
  {
    id: "D2",
    title: "Forensic Science Lab",
    description: "AI-powered autopsy analysis, TOD estimation, and laboratory sciences.",
    icon: Microscope,
    color: "amber",
    accent: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-500/20",
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.15)]",
    modules: "11 Modules",
    tags: ["AI Analysis", "TOD", "Lab Science"],
    path: "/d2/lab-overview",
  },
  {
    id: "D3",
    title: "Intelligence Analytics",
    description: "Pattern recognition, risk engine, behavioral profiling, and link analysis.",
    icon: Brain,
    color: "purple",
    accent: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-slate-200",
    glow: "shadow-[0_0_20px_rgba(139,92,246,0.15)]",
    modules: "11 Modules",
    tags: ["Patterns", "Risk Engine", "AI Summary"],
    path: "/d3/intel-overview",
  },
];

export default function SelectDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { setDashboard, sensors, anomalies } = useData();

  const handleSelect = (id: string, path: string) => {
    setDashboard(id as "D1" | "D2" | "D3");
    router.push(path);
  };

  const activeSensors = sensors.filter(s => s.status === "Online").length;
  const activeAlerts = anomalies.filter(a => a.status === "Unresolved").length;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.05),transparent_50%)]" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full opacity-20" style={{
          backgroundImage: `linear-gradient(rgba(6,182,212,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.1) 1px, transparent 1px)`,
          backgroundSize: '100px 100px'
        }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12 relative z-10"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-violet-100 border border-slate-300 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Shield className="w-7 h-7 text-violet-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tighter font-['Space_Grotesk']">
            AIVENTRA
          </h1>
        </div>
        <p className="text-slate-500 text-lg max-w-lg mx-auto">
          Welcome back, <span className="text-violet-600 font-semibold">{user?.name || "Officer"}</span>. 
          Select your specialized workspace to begin analysis.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl w-full relative z-10">
        {dashboards.map((dash, index) => (
          <motion.div
            key={dash.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -10, scale: 1.02 }}
            onClick={() => handleSelect(dash.id, dash.path)}
            className={cn(
              "cursor-pointer group relative p-8 rounded-3xl border transition-all duration-500",
              dash.bg, dash.border, dash.glow,
              "hover:bg-opacity-20 hover:border-opacity-50"
            )}
          >
            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3", dash.bg, "border", dash.border)}>
              <dash.icon className={cn("w-8 h-8", dash.accent)} />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-3 font-['Space_Grotesk'] tracking-tight group-hover:text-violet-600 transition-colors">
              {dash.title}
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-8 h-12 overflow-hidden">
              {dash.description}
            </p>

            <div className="flex flex-wrap gap-2 mb-8">
              {dash.tags.map(tag => (
                <span key={tag} className={cn("text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500")}>
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between mt-auto">
              <span className={cn("text-xs font-mono font-medium", dash.accent)}>
                {dash.modules}
              </span>
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 group-hover:translate-x-2", dash.bg, "border", dash.border)}>
                <ArrowRight className={cn("w-5 h-5", dash.accent)} />
              </div>
            </div>

            {/* Role indicator if applicable */}
            {((dash.id === "D1" && user?.role === "Investigator") || 
              (dash.id === "D2" && user?.role === "Lab Scientist") ||
              (dash.id === "D3" && user?.role === "Intelligence Analyst") ||
              (user?.role === "Admin")) && (
              <div className="absolute -top-3 -right-3 px-3 py-1 rounded-full bg-cyan-500 text-[10px] font-bold text-slate-900 shadow-lg border border-slate-300">
                RECOMMENDED
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Bottom Status Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-16 w-full max-w-4xl px-8 py-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 backdrop-blur-md flex flex-wrap items-center justify-between gap-6"
      >
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-xs text-slate-500"><span className="text-slate-900 font-bold">{activeAlerts}</span> Active Alerts</span>
          </div>
          <div className="h-4 w-px bg-slate-100" />
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-600" />
            <span className="text-xs text-slate-500"><span className="text-slate-900 font-bold">82/100</span> Risk Score</span>
          </div>
          <div className="h-4 w-px bg-slate-100" />
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-600" />
            <span className="text-xs text-slate-500"><span className="text-slate-900 font-bold">{activeSensors}/{sensors.length}</span> Sensors Online</span>
          </div>
        </div>
        
        <div className="text-[10px] font-mono text-slate-400 tracking-widest uppercase">
          AIVENTRA System Status: <span className="text-green-600">Stable</span>
        </div>
      </motion.div>
    </div>
  );
}
