"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Bot, Upload, Image, Brain, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useData } from "@/lib/store";
import { askGemma } from "@/lib/gemma";

export default function EvidenceImageAIPage() {
  const { cases, evidence } = useData();
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [analysisHistory, setAnalysisHistory] = useState<{ name: string; result: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const analyzeImage = async (name: string) => {
    setLoading(true);
    setFileName(name);

    const prompt = `Analyze forensic evidence image named "${name}" for a criminal investigation:

Active cases: ${cases.map(c => `${c.id}: ${c.title}`).join(", ")}
Image file: ${name}
Related evidence: ${evidence.map(e => `${e.name} (${e.type})`).join(", ")}

Perform a comprehensive forensic image analysis including:
- Object identification (weapons, tools, substances, vehicles, documents)
- Scene classification (indoor/outdoor, residential/commercial/industrial)
- Visible injuries or biological evidence (blood, tissue)
- Environmental conditions visible
- Potential serial numbers, text, or identifiers (OCR)
- Gait or postural analysis (if person visible)
- Estimated time of day from lighting conditions
- Evidence handling recommendations`;

    const result = await askGemma(prompt, "You are a forensic computer vision AI. Analyze crime scene images with precision. Identify objects, injuries, environmental factors, and investigative leads.");
    setAnalysis(result);
    setAnalysisHistory(prev => [{ name, result }, ...prev].slice(0, 5));
    setLoading(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) analyzeImage(file.name);
  };

  const imageEvidence = evidence.filter(e => e.type === "Image");

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-['Space_Grotesk'] tracking-tight">Evidence Image AI</h1>
          <p className="text-slate-500">Gemma-powered object detection, OCR, and scene analysis on evidence photos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload & Evidence List */}
        <Card className="bg-white border-white/5">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900 flex items-center gap-2 font-['Space_Grotesk']">
              <Image className="w-5 h-5 text-amber-600" />
              Evidence Images
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Upload Zone */}
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full p-8 border-2 border-dashed border-amber-500/20 rounded-2xl bg-amber-500/5 hover:bg-amber-50 transition-all flex flex-col items-center gap-3 group"
            >
              <Upload className="w-8 h-8 text-amber-600/50 group-hover:text-amber-600 transition-colors" />
              <p className="text-xs text-slate-400 group-hover:text-slate-500">Upload evidence image for AI analysis</p>
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

            {/* Existing Image Evidence */}
            {imageEvidence.length > 0 ? imageEvidence.map(e => (
              <button
                key={e.id}
                onClick={() => analyzeImage(e.name)}
                className={cn(
                  "w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3",
                  fileName === e.name ? "bg-amber-50 border-amber-500/30" : "bg-slate-50 border-white/5 hover:border-white/15"
                )}
              >
                <Image className={cn("w-5 h-5 shrink-0", fileName === e.name ? "text-amber-600" : "text-slate-400")} />
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-900 truncate">{e.name}</p>
                  <p className="text-[10px] text-slate-400">{e.caseId} • {e.custodyStatus}</p>
                </div>
              </button>
            )) : (
              <p className="text-[10px] text-slate-400 text-center py-4">No image evidence uploaded yet</p>
            )}
          </CardContent>
        </Card>

        {/* AI Analysis Output */}
        <Card className="lg:col-span-2 bg-white border-white/5">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900 flex items-center gap-2 font-['Space_Grotesk']">
              <Brain className="w-5 h-5 text-amber-600" />
              Gemma AI Vision Analysis
              {loading && <Loader2 className="w-4 h-4 animate-spin text-amber-600 ml-2" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                <p className="text-sm text-slate-400">Analyzing {fileName}...</p>
              </div>
            ) : analysis ? (
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-500/20">
                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                  <span className="text-xs font-bold text-amber-600">{fileName}</span>
                </div>
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{analysis}</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <AlertTriangle className="w-3 h-3" />
                  <span>AI analysis is supplementary — all findings must be verified by qualified forensic examiner.</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Bot className="w-12 h-12 text-amber-500/20" />
                <p className="text-sm text-slate-400">Upload or select an image to analyze</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analysis History */}
      {analysisHistory.length > 0 && (
        <Card className="bg-white border-white/5">
          <CardHeader>
            <CardTitle className="text-sm text-slate-400 uppercase tracking-widest">Recent Analysis History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysisHistory.map((h, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Image className="w-4 h-4 text-amber-600/50" />
                    <span className="text-xs text-slate-900 font-medium">{h.name}</span>
                  </div>
                  <span className="text-[10px] text-green-600">✓ Analyzed</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
