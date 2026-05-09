"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Share2, Brain, Loader2, AlertTriangle, Link2, Database } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useData } from "@/lib/store";
import { askGemma } from "@/lib/gemma";

export default function CrossCaseLinksPage() {
  const { cases, evidence, anomalies } = useData();
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);

  const discoverLinks = async () => {
    setLoading(true);
    const prompt = `Analyze these forensic cases for hidden cross-case connections:

Cases:
${cases.map(c => `- ${c.id}: "${c.title}" (${c.type}, ${c.priority} priority, ${c.status}, Officer: ${c.officer}, Victim: ${c.victim}, Location: ${c.location})`).join("\n")}

Evidence across all cases:
${evidence.map(e => `- ${e.name} (${e.type}) linked to ${e.caseId}`).join("\n")}

Anomalies:
${anomalies.map(a => `- ${a.title} (${a.type}, ${a.severity}) linked to ${a.caseId}`).join("\n")}

Discover and report:
1. Cases that share suspects, locations, evidence types, or MO (modus operandi)
2. Common geographic patterns
3. Temporal clustering (cases happening in similar timeframes)
4. Shared physical evidence signatures (ballistics, DNA, fingerprints)
5. Officer overlap analysis
6. Recommended case mergers or joint investigations
7. Confidence level for each discovered link`;

    const result = await askGemma(prompt, "You are a forensic intelligence analyst AI. Discover hidden connections between independent criminal investigations. Be specific about which cases are linked and why.");
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-['Space_Grotesk'] tracking-tight">Cross-Case Links</h1>
          <p className="text-slate-500">AI-discovered connections between independent investigations.</p>
        </div>
        <button
          onClick={discoverLinks}
          disabled={loading || cases.length < 1}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 text-slate-900 font-bold text-sm hover:bg-purple-500 transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
          {loading ? "Discovering Links..." : "Discover Links"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-white/5">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase mb-1">Active Cases</p>
              <p className="text-2xl font-bold text-slate-900 font-mono">{cases.length}</p>
            </div>
            <Database className="w-8 h-8 opacity-20 text-violet-600" />
          </CardContent>
        </Card>
        <Card className="bg-white border-white/5">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase mb-1">Evidence Items</p>
              <p className="text-2xl font-bold text-slate-900 font-mono">{evidence.length}</p>
            </div>
            <Link2 className="w-8 h-8 opacity-20 text-violet-600" />
          </CardContent>
        </Card>
        <Card className="bg-white border-white/5">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase mb-1">Anomalies</p>
              <p className="text-2xl font-bold text-slate-900 font-mono">{anomalies.length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 opacity-20 text-amber-600" />
          </CardContent>
        </Card>
      </div>

      {/* Case Matrix */}
      <Card className="bg-white border-white/5">
        <CardHeader>
          <CardTitle className="text-lg text-slate-900 flex items-center gap-2 font-['Space_Grotesk']">
            <Share2 className="w-5 h-5 text-violet-600" />
            Case Comparison Matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase text-left">Case ID</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase text-left">Title</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase text-left">Type</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase text-left">Location</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase text-left">Officer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {cases.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 hover:bg-slate-100 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-violet-600">{c.id}</td>
                    <td className="px-4 py-3 text-sm text-slate-900">{c.title}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{c.type}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{c.location}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{c.officer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* AI Discovery Results */}
      <Card className="bg-white border-white/5">
        <CardHeader>
          <CardTitle className="text-lg text-slate-900 flex items-center gap-2 font-['Space_Grotesk']">
            <Brain className="w-5 h-5 text-violet-600" />
            Gemma AI Cross-Case Intelligence
            {loading && <Loader2 className="w-4 h-4 animate-spin text-violet-600 ml-2" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
              <p className="text-sm text-slate-400">Analyzing {cases.length} cases for hidden links...</p>
            </div>
          ) : analysis ? (
            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{analysis}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Share2 className="w-12 h-12 text-purple-500/20" />
              <p className="text-sm text-slate-400">Click "Discover Links" to find hidden case connections</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
