"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Brain, Loader2, Database, Upload, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useData } from "@/lib/store";
import { askGemma } from "@/lib/gemma";

const sampleTypes = [
  { id: "blood", label: "Blood Sample", desc: "STR profiling from blood evidence" },
  { id: "hair", label: "Hair Follicle", desc: "Mitochondrial DNA extraction" },
  { id: "saliva", label: "Saliva / Buccal", desc: "Reference sample comparison" },
  { id: "tissue", label: "Tissue Sample", desc: "Degraded DNA recovery" },
  { id: "touch", label: "Touch DNA", desc: "Low copy number analysis" },
];

export default function DNABioDataPage() {
  const { cases, evidence } = useData();
  const [selectedSample, setSelectedSample] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState("");

  const analyzeDNA = async (sampleId: string) => {
    setSelectedSample(sampleId);
    setLoading(true);
    const sample = sampleTypes.find(s => s.id === sampleId)!;
    const caseData = cases.find(c => c.id === selectedCase);
    const caseEvidence = evidence.filter(e => e.caseId === selectedCase);

    const prompt = `Perform forensic DNA analysis on a ${sample.label}:

Sample type: ${sample.label} — ${sample.desc}
Case: ${caseData ? `${caseData.id}: ${caseData.title}` : "No case selected"}
Evidence items in case: ${caseEvidence.map(e => `${e.name} (${e.type})`).join(", ") || "None"}

Provide a comprehensive forensic DNA report including:
- STR (Short Tandem Repeat) profiling results for 20+ loci
- Electropherogram peak interpretation
- Allele calls for each locus (D3S1358, vWA, FGA, D8S1179, D21S11, D18S51, D5S818, D13S317, D7S820, CSF1PO, TPOX, TH01, D16S539, D2S1338, D19S433, Amelogenin)
- CODIS database match probability
- Random match probability (RMP) calculation
- Mixture profile assessment (if applicable)
- DNA degradation index
- PCR amplification quality metrics
- Chain of custody compliance for the sample`;

    const result = await askGemma(prompt, "You are a forensic DNA analyst AI. Generate detailed STR profiling results and CODIS match probabilities.");
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-['Space_Grotesk'] tracking-tight">DNA & Bio Data</h1>
          <p className="text-slate-500">STR profiling, electropherogram visualization, and CODIS matching.</p>
        </div>
        <select
          value={selectedCase}
          onChange={(e) => setSelectedCase(e.target.value)}
          className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-amber-500/20 text-slate-900 text-sm focus:outline-none"
        >
          <option value="">Select case...</option>
          {cases.map(c => <option key={c.id} value={c.id}>{c.id} — {c.title}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "DNA Profiles", value: String(evidence.filter(e => (e.tags || []).some(t => t.toLowerCase().includes("dna"))).length + 18), icon: Database, color: "text-amber-600" },
          { label: "CODIS Hits", value: "7", icon: CheckCircle2, color: "text-green-600" },
          { label: "Pending Analysis", value: "4", icon: Activity, color: "text-blue-600" },
          { label: "AI Engine", value: "Gemma", icon: Brain, color: "text-violet-600" },
        ].map((stat, i) => (
          <Card key={i} className="bg-white border-white/5">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900 font-mono">{stat.value}</p>
              </div>
              <stat.icon className={cn("w-8 h-8 opacity-20", stat.color)} />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="bg-white border-white/5">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900 flex items-center gap-2 font-['Space_Grotesk']">
              <Activity className="w-5 h-5 text-amber-600" />
              Sample Type
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sampleTypes.map(sample => (
              <button
                key={sample.id}
                onClick={() => analyzeDNA(sample.id)}
                className={cn(
                  "w-full text-left p-4 rounded-xl border transition-all",
                  selectedSample === sample.id
                    ? "bg-amber-50 border-amber-500/30"
                    : "bg-slate-50 border-white/5 hover:border-white/15"
                )}
              >
                <p className={cn("text-sm font-bold", selectedSample === sample.id ? "text-amber-600" : "text-slate-900")}>{sample.label}</p>
                <p className="text-[10px] text-slate-400">{sample.desc}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-white border-white/5">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900 flex items-center gap-2 font-['Space_Grotesk']">
              <Brain className="w-5 h-5 text-amber-600" />
              Gemma AI DNA Analysis
              {loading && <Loader2 className="w-4 h-4 animate-spin text-amber-600 ml-2" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                <p className="text-sm text-slate-400">Running STR profiling on {sampleTypes.find(s => s.id === selectedSample)?.label}...</p>
              </div>
            ) : analysis ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{analysis}</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <AlertTriangle className="w-3 h-3" />
                  <span>AI-generated profile — must be validated by certified DNA analyst before court submission.</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Activity className="w-12 h-12 text-amber-500/20" />
                <p className="text-sm text-slate-400">Select a sample type to run DNA analysis</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
