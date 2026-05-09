"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, ShieldAlert, Zap, TrendingUp, CheckCircle2, Brain, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useData } from "@/lib/store";
import { askGemma } from "@/lib/gemma";

export default function RiskScoreEnginePage() {
  const { cases, anomalies, sensors, evidence } = useData();
  const [isCalculating, setIsCalculating] = useState(false);
  const [aiLogic, setAiLogic] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Derive risk score from real data
  const unresolvedAnomalies = anomalies.filter(a => a.status === "Unresolved").length;
  const offlineSensors = sensors.filter(s => s.status === "Offline").length;
  const activeCases = cases.filter(c => c.status === "Active").length;
  const score = Math.min(99, Math.max(10, 40 + (unresolvedAnomalies * 8) + (offlineSensors * 5) + (activeCases * 3)));

  const riskFactors = [
    { label: "Unresolved Anomalies", value: String(unresolvedAnomalies), trend: unresolvedAnomalies > 2 ? "up" : "stable", impact: unresolvedAnomalies > 3 ? "Critical" : "Medium" },
    { label: "Active Cases", value: `${activeCases} Cases`, trend: "stable", impact: activeCases > 3 ? "High" : "Medium" },
    { label: "Offline Sensors", value: `${offlineSensors}/${sensors.length}`, trend: offlineSensors > 1 ? "up" : "down", impact: offlineSensors > 2 ? "High" : "Low" },
    { label: "Evidence Coverage", value: `${evidence.length} Items`, trend: "stable", impact: evidence.length < 5 ? "Critical" : "Medium" },
  ];

  const runAIAssessment = async () => {
    setAiLoading(true);
    const prompt = `Perform a forensic risk assessment based on this operational data:

Active cases: ${cases.map(c => `${c.id}: ${c.title} (${c.status}, ${c.priority} priority)`).join("; ")}
Unresolved anomalies: ${unresolvedAnomalies} out of ${anomalies.length} total
Sensor status: ${sensors.map(s => `${s.name}: ${s.status}`).join(", ")}
Evidence items: ${evidence.length} total across ${cases.length} cases
Computed threat index: ${score}/100

Generate exactly 4 concise forensic intelligence observations as separate lines. Each should be a specific, actionable insight based on the data. No numbering or bullets — just plain text, one insight per line.`;

    const result = await askGemma(prompt, "You are a forensic threat assessment AI. Generate precise risk intelligence observations. Each observation should be 1-2 sentences max.");
    const lines = result.split("\n").filter(l => l.trim().length > 10).slice(0, 4);
    setAiLogic(lines.length > 0 ? lines : ["AI assessment complete — no critical patterns detected at this time."]);
    setAiLoading(false);
  };

  useEffect(() => {
    runAIAssessment();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-['Space_Grotesk'] tracking-tight">Risk Score Engine</h1>
          <p className="text-slate-500">Neural-network based threat assessment and case prioritization.</p>
        </div>
        <button
          onClick={runAIAssessment}
          disabled={aiLoading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 text-slate-900 font-bold text-sm hover:bg-purple-500 transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] disabled:opacity-50"
        >
          {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {aiLoading ? "Calculating Threat..." : "Reassess Risk"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Threat Gauge */}
        <Card className="lg:col-span-1 bg-white border-white/5 relative overflow-hidden flex flex-col items-center justify-center p-8">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_70%)]" />

           <div className="relative w-64 h-64 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                 <circle cx="128" cy="128" r="110" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                 <motion.circle
                    cx="128" cy="128" r="110"
                    fill="none"
                    stroke="url(#purpleGradient)"
                    strokeWidth="12"
                    strokeDasharray="691"
                    initial={{ strokeDashoffset: 691 }}
                    animate={{ strokeDashoffset: 691 - (691 * (score / 100)) }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="round"
                 />
                 <defs>
                   <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                     <stop offset="0%" stopColor="#8B5CF6" />
                     <stop offset="100%" stopColor="#D8B4FE" />
                   </linearGradient>
                 </defs>
              </svg>
              <div className="absolute flex flex-col items-center text-center">
                 <motion.span
                    key={score}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-6xl font-bold text-slate-900 font-mono"
                 >
                    {score}
                 </motion.span>
                 <span className="text-[10px] font-bold text-violet-600 uppercase tracking-[0.2em] mt-2">Threat Index</span>
              </div>
           </div>

           <div className={cn("mt-8 flex items-center gap-2 px-4 py-2 rounded-full border",
             score > 75 ? "bg-red-500/10 border-red-500/20" : score > 50 ? "bg-amber-50 border-amber-500/20" : "bg-green-500/10 border-green-500/20"
           )}>
              <ShieldAlert className={cn("w-4 h-4", score > 75 ? "text-red-500" : score > 50 ? "text-amber-500" : "text-green-500")} />
              <span className={cn("text-xs font-bold uppercase", score > 75 ? "text-red-600" : score > 50 ? "text-amber-600" : "text-green-600")}>
                {score > 75 ? "Critical Escalation Recommended" : score > 50 ? "Elevated Monitoring" : "Normal Operations"}
              </span>
           </div>
        </Card>

        <div className="lg:col-span-2 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {riskFactors.map((factor, i) => (
                <Card key={i} className="bg-white border-white/5 group hover:border-purple-500/30 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">{factor.label}</span>
                      <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded",
                        factor.impact === "Critical" ? "bg-red-500/10 text-red-600" : "bg-violet-50 text-violet-600"
                      )}>{factor.impact} IMPACT</span>
                    </div>
                    <div className="flex items-end justify-between">
                      <span className="text-2xl font-bold text-slate-900 font-mono">{factor.value}</span>
                      {factor.trend === "up" && <TrendingUp className="w-4 h-4 text-red-600" />}
                    </div>
                  </CardContent>
                </Card>
              ))}
           </div>

           {/* AI Logic Chains */}
           <Card className="bg-white border-white/5">
             <CardHeader>
                <CardTitle className="text-lg text-slate-900 flex items-center gap-2 font-['Space_Grotesk']">
                  <Brain className="w-5 h-5 text-violet-600" />
                  Gemma AI Logic Chains
                  {aiLoading && <Loader2 className="w-4 h-4 animate-spin text-violet-600 ml-2" />}
                </CardTitle>
             </CardHeader>
             <CardContent>
                <div className="space-y-4">
                   {aiLogic.length > 0 ? aiLogic.map((logic, i) => (
                     <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-white/5">
                        <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 className="w-3 h-3 text-violet-600" />
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{logic}</p>
                     </div>
                   )) : (
                     <p className="text-xs text-slate-400 text-center py-8">Click "Reassess Risk" to generate AI intelligence.</p>
                   )}
                </div>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
