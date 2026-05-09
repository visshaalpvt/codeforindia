"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Brain, Loader2, Plus, AlertTriangle, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useData } from "@/lib/store";
import { askGemma } from "@/lib/gemma";

const bodyRegions = [
  { id: "head", label: "Head & Cranium", x: "50%", y: "8%", w: "15%", h: "10%" },
  { id: "neck", label: "Neck", x: "50%", y: "16%", w: "8%", h: "4%" },
  { id: "chest", label: "Chest / Thorax", x: "50%", y: "25%", w: "22%", h: "12%" },
  { id: "abdomen", label: "Abdomen", x: "50%", y: "37%", w: "20%", h: "10%" },
  { id: "left-arm", label: "Left Upper Limb", x: "28%", y: "30%", w: "8%", h: "20%" },
  { id: "right-arm", label: "Right Upper Limb", x: "72%", y: "30%", w: "8%", h: "20%" },
  { id: "pelvis", label: "Pelvis", x: "50%", y: "48%", w: "18%", h: "6%" },
  { id: "left-leg", label: "Left Lower Limb", x: "40%", y: "65%", w: "10%", h: "28%" },
  { id: "right-leg", label: "Right Lower Limb", x: "60%", y: "65%", w: "10%", h: "28%" },
];

export default function WoundAnalysisPage() {
  const { cases, evidence } = useData();
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [wounds, setWounds] = useState<{ region: string; type: string; notes: string }[]>([]);

  const analyzeRegion = async (regionId: string) => {
    const region = bodyRegions.find(r => r.id === regionId);
    if (!region) return;
    setSelectedRegion(regionId);
    setLoading(true);

    const relevantEvidence = evidence.filter(e =>
      e.tags.some(t => t.toLowerCase().includes("wound") || t.toLowerCase().includes("injury") || t.toLowerCase().includes("trauma"))
    );

    const prompt = `Analyze wounds in the ${region.label} region for a forensic autopsy:

Active cases: ${cases.map(c => `${c.id}: ${c.title}`).join(", ")}
Relevant evidence items: ${relevantEvidence.map(e => `${e.name} (${e.type})`).join(", ") || "No wound-specific evidence uploaded yet"}
Body region: ${region.label}
${wounds.filter(w => w.region === regionId).map(w => `Existing wound: ${w.type} — ${w.notes}`).join("\n")}

Provide a forensic wound analysis for this region including:
- Likely wound characteristics (contusion, laceration, incision, abrasion, puncture)
- Estimated force and direction of impact
- Possible weapon type
- Clinical significance
- Whether this injury is ante-mortem, peri-mortem, or post-mortem`;

    const result = await askGemma(prompt, "You are a forensic pathologist AI. Provide precise wound analysis assessments for autopsy investigations.");
    setAnalysis(result);
    setLoading(false);
  };

  const addWound = () => {
    if (!selectedRegion) return;
    setWounds(prev => [...prev, {
      region: selectedRegion,
      type: "Unclassified",
      notes: "Pending examination",
    }]);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-['Space_Grotesk'] tracking-tight">Wound Analysis</h1>
          <p className="text-slate-500">Interactive body map with AI-powered force and direction diagnostics.</p>
        </div>
        <button onClick={addWound} disabled={!selectedRegion} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-900 font-bold text-sm hover:bg-amber-400 transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
          <Plus className="w-4 h-4" /> Log Wound
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Body Map */}
        <Card className="bg-white border-white/5">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900 flex items-center gap-2 font-['Space_Grotesk']">
              <Activity className="w-5 h-5 text-amber-600" />
              Body Map — Click a Region
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full aspect-[3/5] bg-slate-50 rounded-2xl border border-white/5 overflow-hidden">
              {/* Body silhouette outline */}
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <svg viewBox="0 0 200 400" className="w-48 h-full">
                  <ellipse cx="100" cy="35" rx="25" ry="30" fill="none" stroke="currentColor" strokeWidth="1" className="text-slate-400" />
                  <rect x="75" y="65" width="50" height="80" rx="10" fill="none" stroke="currentColor" strokeWidth="1" className="text-slate-400" />
                  <rect x="45" y="70" width="20" height="60" rx="8" fill="none" stroke="currentColor" strokeWidth="1" className="text-slate-400" />
                  <rect x="135" y="70" width="20" height="60" rx="8" fill="none" stroke="currentColor" strokeWidth="1" className="text-slate-400" />
                  <rect x="78" y="150" width="20" height="90" rx="8" fill="none" stroke="currentColor" strokeWidth="1" className="text-slate-400" />
                  <rect x="102" y="150" width="20" height="90" rx="8" fill="none" stroke="currentColor" strokeWidth="1" className="text-slate-400" />
                </svg>
              </div>

              {/* Clickable Regions */}
              {bodyRegions.map((region) => {
                const woundCount = wounds.filter(w => w.region === region.id).length;
                return (
                  <button
                    key={region.id}
                    onClick={() => analyzeRegion(region.id)}
                    className={cn(
                      "absolute rounded-xl border-2 transition-all duration-300 flex items-center justify-center group",
                      selectedRegion === region.id
                        ? "bg-amber-100 border-amber-500/60"
                        : woundCount > 0
                        ? "bg-red-500/10 border-red-500/30 hover:bg-red-100"
                        : "bg-slate-50 border-transparent hover:bg-slate-50 hover:bg-slate-100 hover:border-slate-200"
                    )}
                    style={{
                      left: `calc(${region.x} - ${region.w} / 2)`,
                      top: region.y,
                      width: region.w,
                      height: region.h,
                    }}
                    title={region.label}
                  >
                    {woundCount > 0 && (
                      <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">{woundCount}</span>
                    )}
                    <span className="absolute -bottom-5 text-[8px] font-bold text-slate-400 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {region.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Logged Wounds Summary */}
            {wounds.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Logged Wounds ({wounds.length})</p>
                {wounds.map((w, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/10">
                    <span className="text-xs text-red-600 font-bold">{bodyRegions.find(r => r.id === w.region)?.label}</span>
                    <span className="text-[10px] text-slate-400">{w.type}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Analysis Output */}
        <Card className="bg-white border-white/5">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900 flex items-center gap-2 font-['Space_Grotesk']">
              <Brain className="w-5 h-5 text-amber-600" />
              Gemma AI Wound Assessment
              {loading && <Loader2 className="w-4 h-4 animate-spin text-amber-600 ml-2" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                <p className="text-sm text-slate-400">Analyzing {bodyRegions.find(r => r.id === selectedRegion)?.label}...</p>
              </div>
            ) : analysis ? (
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-500/20">
                  <Activity className="w-3 h-3 text-amber-600" />
                  <span className="text-xs font-bold text-amber-600">{bodyRegions.find(r => r.id === selectedRegion)?.label}</span>
                </div>
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{analysis}</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <AlertTriangle className="w-3 h-3" />
                  <span>AI-generated assessment — requires validation by certified forensic pathologist.</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Activity className="w-12 h-12 text-amber-500/20" />
                <p className="text-sm text-slate-400">Click a body region to analyze</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
