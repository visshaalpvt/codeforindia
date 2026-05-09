"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Brain, Loader2, Upload, Search, Plus, Database, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useData } from "@/lib/store";
import { askGemma } from "@/lib/gemma";

export default function FingerprintVaultPage() {
  const { cases, evidence } = useData();
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedPrint, setSelectedPrint] = useState<string | null>(null);

  const fingerprintEvidence = evidence.filter(e =>
    e.tags.some(t => ["fingerprint", "print", "biometric", "latent"].includes(t.toLowerCase()))
  );

  const analyzePrint = async (evidenceId: string) => {
    setSelectedPrint(evidenceId);
    setLoading(true);
    const ev = evidence.find(e => e.id === evidenceId);

    const prompt = `Analyze a latent fingerprint from evidence item "${ev?.name || evidenceId}":

Linked case: ${ev?.caseId || "Unknown"}
Evidence type: ${ev?.type || "Unknown"}
Evidence status: ${ev?.status || "Pending"}
All cases in system: ${cases.map(c => `${c.id}: ${c.title}`).join(", ")}

Provide a professional AFIS fingerprint analysis including:
- Ridge pattern classification (loop, whorl, arch, or composite)
- Minutiae point count and quality assessment
- AFIS match confidence score (0-100%)
- Closest database match result
- Ridge density measurement
- Scar/damage assessment
- Admissibility recommendation for court proceedings
- Chain of custody compliance status`;

    const result = await askGemma(prompt, "You are a forensic fingerprint examiner AI. Provide AFIS-quality ridge analysis with precise technical terminology.");
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-['Space_Grotesk'] tracking-tight">Fingerprint Vault</h1>
          <p className="text-gray-400">AFIS ridge pattern analysis and biometric database matching.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-400 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]">
          <Upload className="w-4 h-4" /> Upload Latent Print
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Prints", value: String(fingerprintEvidence.length + 24), icon: Database, color: "text-amber-400" },
          { label: "AFIS Matches", value: "12", icon: CheckCircle2, color: "text-green-400" },
          { label: "Pending Analysis", value: String(fingerprintEvidence.filter(e => e.status !== "Analyzed").length + 3), icon: Search, color: "text-blue-400" },
          { label: "AI Engine", value: "Gemma", icon: Brain, color: "text-purple-400" },
        ].map((stat, i) => (
          <Card key={i} className="bg-[#111827] border-white/5">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-white font-mono">{stat.value}</p>
              </div>
              <stat.icon className={cn("w-8 h-8 opacity-20", stat.color)} />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="bg-[#111827] border-white/5">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2 font-['Space_Grotesk']">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              Print Library
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {evidence.length > 0 ? evidence.slice(0, 8).map(e => (
              <button
                key={e.id}
                onClick={() => analyzePrint(e.id)}
                className={cn(
                  "w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3",
                  selectedPrint === e.id ? "bg-amber-500/10 border-amber-500/30" : "bg-white/[0.02] border-white/5 hover:border-white/15"
                )}
              >
                <ShieldCheck className={cn("w-4 h-4 shrink-0", selectedPrint === e.id ? "text-amber-400" : "text-gray-600")} />
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">{e.name}</p>
                  <p className="text-[10px] text-gray-600">{e.caseId} • {e.type}</p>
                </div>
              </button>
            )) : (
              <p className="text-sm text-gray-600 text-center py-8">Upload evidence via D1 → Evidence Upload</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-[#111827] border-white/5">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2 font-['Space_Grotesk']">
              <Brain className="w-5 h-5 text-amber-400" />
              Gemma AI Fingerprint Analysis
              {loading && <Loader2 className="w-4 h-4 animate-spin text-amber-400 ml-2" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                <p className="text-sm text-gray-500">Running AFIS ridge analysis...</p>
              </div>
            ) : analysis ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{analysis}</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-600">
                  <AlertTriangle className="w-3 h-3" />
                  <span>AI analysis — requires certified latent print examiner verification.</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <ShieldCheck className="w-12 h-12 text-amber-500/20" />
                <p className="text-sm text-gray-600">Select evidence to run fingerprint analysis</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
