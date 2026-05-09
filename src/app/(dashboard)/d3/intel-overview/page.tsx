"use client";

import React from "react";
import { motion } from "framer-motion";
import { Brain, Share2, AlertTriangle, Zap, TrendingUp, ShieldCheck, Search, Database, Globe } from "lucide-react";
import { useData } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function IntelligenceOverviewPage() {
  const { anomalies, correlationNodes, correlationEdges } = useData();

  const stats = [
    { label: "Neural Nodes", value: correlationNodes.length.toString(), icon: Share2, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Active Links", value: correlationEdges.length.toString(), icon: Database, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Anomaly Score", value: "84/100", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-500/10" },
    { label: "AI Prediction", value: "High", icon: Brain, color: "text-violet-600", bg: "bg-violet-50" },
  ];

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900 font-['Space_Grotesk'] tracking-tight">Intelligence Analytics</h1>
        <p className="text-slate-500">Cross-case pattern recognition and predictive risk modeling.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-white border-white/5 hover:border-purple-500/30 transition-colors group">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-slate-900 font-mono">{stat.value}</p>
                </div>
                <div className={cn("p-3 rounded-xl transition-all group-hover:rotate-12", stat.bg)}>
                  <stat.icon className={cn("w-6 h-6", stat.color)} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-white border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-violet-50" />
          <CardHeader>
            <CardTitle className="text-lg text-slate-900 flex items-center gap-2 font-['Space_Grotesk']">
              <TrendingUp className="w-5 h-5 text-violet-600" />
              Pattern Anomaly Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] w-full flex items-end gap-2 px-2">
              {[45, 60, 32, 85, 40, 55, 75, 90, 65, 42, 58, 70].map((val, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${val}%` }}
                  transition={{ delay: i * 0.05, duration: 1 }}
                  className={cn(
                    "flex-1 rounded-t-lg transition-colors",
                    val > 80 ? "bg-red-500/40" : "bg-violet-100 hover:bg-purple-500/40"
                  )}
                />
              ))}
            </div>
            <div className="flex justify-between mt-4 text-[10px] text-slate-400 font-mono uppercase tracking-widest">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>23:59</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-white/5">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900 flex items-center gap-2 font-['Space_Grotesk']">
              <ShieldCheck className="w-5 h-5 text-violet-600" />
              Intelligence Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {anomalies.slice(0, 4).map((anomaly, i) => (
                <div key={anomaly.id} className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-white/5 flex items-start gap-4">
                  <div className={cn("p-2 rounded-lg mt-1", 
                    anomaly.severity === "Critical" ? "bg-red-500/10" : "bg-amber-50"
                  )}>
                    <Zap className={cn("w-4 h-4", 
                      anomaly.severity === "Critical" ? "text-red-600" : "text-amber-600"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-slate-900 truncate">{anomaly.title}</p>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">2m ago</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{anomaly.description}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <button className="text-[10px] font-bold text-violet-600 uppercase tracking-widest hover:text-violet-700 transition-colors flex items-center gap-1">
                        <Search className="w-3 h-3" /> Analyze
                      </button>
                      <button className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors flex items-center gap-1">
                        <Globe className="w-3 h-3" /> Sources
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
