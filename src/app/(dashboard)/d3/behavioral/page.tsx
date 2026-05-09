"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { User, Brain, Activity, ShieldAlert, Loader2, AlertTriangle, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useData } from "@/lib/store";
import { askGemma } from "@/lib/gemma";

export default function BehavioralProfilerPage() {
  const { cases, anomalies } = useData();
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [profile, setProfile] = useState("");
  const [loading, setLoading] = useState(false);

  const generateProfile = async (caseId: string) => {
    setSelectedCase(caseId);
    setLoading(true);
    const c = cases.find(cs => cs.id === caseId);
    const caseAnomalies = anomalies.filter(a => a.caseId === caseId);

    const prompt = `Generate a forensic behavioral profile for the suspect(s) in case ${caseId}:

Case: ${c?.title || "Unknown"}
Case priority: ${c?.priority || "Unknown"}
Case status: ${c?.status || "Unknown"}
Related anomalies: ${caseAnomalies.map(a => `${a.type}: ${a.description}`).join("; ") || "None detected"}

Generate a professional behavioral analysis including:
- Psychological stability assessment (0-100 score)
- Behavioral pattern classification (cyclical, escalating, opportunistic, or organized)
- Predictive next-action analysis
- Recommended intervention strategy

Use a professional forensic psychology tone.`;

    const result = await askGemma(prompt, "You are a forensic behavioral psychologist AI. Generate precise behavioral profiles for criminal investigations.");
    setProfile(result);
    setLoading(false);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-white font-['Space_Grotesk'] tracking-tight">Behavioral Profiler</h1>
        <p className="text-gray-400">AI-generated psychological trait mapping and predictive analysis.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Case Selector */}
        <Card className="bg-[#111827] border-white/5">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2 font-['Space_Grotesk']">
              <User className="w-5 h-5 text-purple-400" />
              Select Case
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cases.length > 0 ? cases.map(c => (
              <button
                key={c.id}
                onClick={() => generateProfile(c.id)}
                className={cn(
                  "w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group",
                  selectedCase === c.id
                    ? "bg-purple-500/10 border-purple-500/30"
                    : "bg-white/[0.02] border-white/5 hover:border-white/15"
                )}
              >
                <div>
                  <p className={cn("text-xs font-mono font-bold", selectedCase === c.id ? "text-purple-400" : "text-gray-500")}>{c.id}</p>
                  <p className="text-sm text-white font-medium">{c.title}</p>
                  <p className="text-[10px] text-gray-600 uppercase">{c.priority} Priority</p>
                </div>
                <ChevronRight className={cn("w-4 h-4", selectedCase === c.id ? "text-purple-400" : "text-gray-700")} />
              </button>
            )) : (
              <p className="text-sm text-gray-600 text-center py-8">No cases in system. Create cases in D1.</p>
            )}
          </CardContent>
        </Card>

        {/* Profile Output */}
        <Card className="lg:col-span-2 bg-[#111827] border-white/5">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2 font-['Space_Grotesk']">
              <Brain className="w-5 h-5 text-purple-400" />
              Gemma AI Behavioral Assessment
              {loading && <Loader2 className="w-4 h-4 animate-spin text-purple-400 ml-2" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                <p className="text-sm text-gray-500">Generating behavioral profile...</p>
              </div>
            ) : profile ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{profile}</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-600">
                  <AlertTriangle className="w-3 h-3" />
                  <span>AI-generated assessment — must be reviewed by qualified forensic psychologist before use in proceedings.</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Brain className="w-12 h-12 text-purple-500/20" />
                <p className="text-sm text-gray-600">Select a case to generate behavioral profile</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
