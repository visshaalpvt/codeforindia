"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Beaker, FlaskConical, CheckCircle2, Search, Plus, Activity, Zap, ShieldAlert, Clock, Brain, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useData } from "@/lib/store";
import { askGemma } from "@/lib/gemma";

export default function ToxicologyPage() {
  const { cases, evidence } = useData();
  const [activeTab, setActiveTab] = useState("active");
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Derive toxicology data from real evidence in the store
  const toxEvidence = evidence.filter(e => e.tags.some(t => t.toLowerCase().includes("toxicolog") || t.toLowerCase().includes("chemical") || t.toLowerCase().includes("blood")));
  const activeScreens = toxEvidence.length;
  const criticalFindings = toxEvidence.filter(e => e.tags.includes("critical")).length;

  const runAIAnalysis = async () => {
    setAiLoading(true);
    const prompt = `Analyze the following toxicology lab data for a forensic investigation:

Cases in system: ${cases.map(c => `${c.id} (${c.title})`).join(", ")}
Evidence items tagged for toxicology: ${toxEvidence.length}
Evidence details: ${toxEvidence.map(e => `${e.name} - tags: ${e.tags.join(", ")}`).join("; ")}

Provide a professional forensic toxicology assessment including:
1. Substances likely present based on the evidence
2. Clinical significance of each finding
3. Recommended additional tests
4. How these findings impact the investigation`;

    const result = await askGemma(prompt, "You are a forensic toxicologist AI. Provide precise chemical analysis assessments. Use bullet points. Be concise.");
    setAiAnalysis(result);
    setAiLoading(false);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-['Space_Grotesk'] tracking-tight">Toxicology Panel</h1>
          <p className="text-gray-400">Chemical analysis and drug screening for biological samples.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={runAIAnalysis}
            disabled={aiLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-sm hover:bg-amber-500/20 transition-all disabled:opacity-50"
          >
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
            {aiLoading ? "Analyzing..." : "AI Tox Analysis"}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-400 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <Plus className="w-4 h-4" /> Request New Panel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Active Screens", value: String(activeScreens).padStart(2, "0"), icon: FlaskConical, color: "text-amber-400" },
          { label: "Critical Findings", value: String(criticalFindings).padStart(2, "0"), icon: ShieldAlert, color: "text-red-400" },
          { label: "Pending Labs", value: String(cases.filter(c => c.status === "Active").length), icon: Clock, color: "text-blue-400" },
          { label: "Completed (24h)", value: String(evidence.filter(e => e.status === "Analyzed").length), icon: CheckCircle2, color: "text-green-400" },
        ].map((stat, i) => (
          <Card key={i} className="bg-[#111827] border-white/5">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
              <stat.icon className={cn("w-8 h-8 opacity-20", stat.color)} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Analysis Section */}
      {aiAnalysis && (
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2 font-['Space_Grotesk']">
              <Brain className="w-5 h-5 text-amber-400" />
              Gemma AI Toxicology Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{aiAnalysis}</p>
          </CardContent>
        </Card>
      )}

      {/* Evidence Table from Store */}
      <Card className="bg-[#111827] border-white/5">
        <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveTab("active")} className={cn("text-sm font-bold transition-all px-2 py-1", activeTab === "active" ? "text-amber-400 border-b-2 border-amber-400" : "text-gray-500")}>Active Screens</button>
            <button onClick={() => setActiveTab("history")} className={cn("text-sm font-bold transition-all px-2 py-1", activeTab === "history" ? "text-amber-400 border-b-2 border-amber-400" : "text-gray-500")}>All Evidence</button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-white/5">
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Evidence ID</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Type</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Linked Case</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(activeTab === "active" ? toxEvidence : evidence).map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono text-amber-400">{item.id}</td>
                    <td className="px-6 py-4 text-sm font-bold text-white">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{item.type}</td>
                    <td className="px-6 py-4">
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border",
                        item.status === "Analyzed" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                        "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      )}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-400">{item.caseId}</td>
                  </tr>
                ))}
                {(activeTab === "active" ? toxEvidence : evidence).length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-600 text-sm">
                      No evidence items found. Upload evidence via D1 → Evidence Upload.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#111827] border-white/5">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2 font-['Space_Grotesk']">
              <Activity className="w-5 h-5 text-amber-400" />
              Mass Spectrometry Output
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 w-full bg-white/5 rounded-xl border border-white/5 relative overflow-hidden p-4">
               <div className="absolute inset-0 flex items-end justify-around px-4">
                 {[10, 40, 15, 80, 20, 35, 95, 25, 45, 60, 10, 15, 30].map((h, i) => (
                   <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    className="w-1.5 bg-amber-500/40 rounded-t-sm relative group"
                   >
                     <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-mono text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
                       {(h * 12.4).toFixed(0)}
                     </div>
                   </motion.div>
                 ))}
               </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111827] border-white/5">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2 font-['Space_Grotesk']">
              <Beaker className="w-5 h-5 text-amber-400" />
              Lab Equipment Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
               <div className="flex items-center gap-3">
                 <Zap className="w-4 h-4 text-green-400" />
                 <span className="text-sm text-white">Centrifuge #1</span>
               </div>
               <span className="text-[10px] font-bold text-green-400 uppercase">Operational</span>
             </div>
             <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
               <div className="flex items-center gap-3">
                 <Zap className="w-4 h-4 text-green-400" />
                 <span className="text-sm text-white">Sequence Bot-7</span>
               </div>
               <span className="text-[10px] font-bold text-green-400 uppercase">Operational</span>
             </div>
             <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 opacity-50">
               <div className="flex items-center gap-3">
                 <Zap className="w-4 h-4 text-gray-500" />
                 <span className="text-sm text-white">GC-MS Scanner</span>
               </div>
               <span className="text-[10px] font-bold text-gray-500 uppercase">Idle</span>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
