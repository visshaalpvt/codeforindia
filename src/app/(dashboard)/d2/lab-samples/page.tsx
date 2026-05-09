"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Clock, CheckCircle2, FlaskConical, Beaker, ShieldCheck, Database, Plus, X, ArrowRight, PackageOpen, Download, Brain, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useData } from "@/lib/store";
import { askGemma } from "@/lib/gemma";
import { downloadReport, generateForensicReport } from "@/lib/download";

const pipelineStages = [
  { id: "intake", name: "Intake", icon: PackageOpen, color: "text-blue-600", bg: "bg-blue-500/10" },
  { id: "prep", name: "Preparation", icon: Beaker, color: "text-amber-600", bg: "bg-amber-50" },
  { id: "analysis", name: "Analysis", icon: FlaskConical, color: "text-violet-600", bg: "bg-violet-50" },
  { id: "verification", name: "Verification", icon: ShieldCheck, color: "text-green-600", bg: "bg-green-500/10" },
  { id: "archive", name: "Archive", icon: Database, color: "text-slate-500", bg: "bg-gray-500/10" },
];

type Sample = { id: string; name: string; type: string; stage: string; caseId: string; submittedAt: string };

export default function LabSamplePipelinePage() {
  const { cases, evidence } = useData();
  const [samples, setSamples] = useState<Sample[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newSample, setNewSample] = useState({ name: "", type: "Blood", caseId: "" });
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const addSample = () => {
    if (!newSample.name) return;
    setSamples(prev => [...prev, {
      id: `SMPL-${String(prev.length + 1).padStart(3, "0")}`,
      name: newSample.name,
      type: newSample.type,
      stage: "intake",
      caseId: newSample.caseId || cases[0]?.id || "Unlinked",
      submittedAt: new Date().toISOString(),
    }]);
    setNewSample({ name: "", type: "Blood", caseId: "" });
    setShowAdd(false);
  };

  const advanceStage = (sampleId: string) => {
    const stageOrder = pipelineStages.map(s => s.id);
    setSamples(prev => prev.map(s => {
      if (s.id !== sampleId) return s;
      const idx = stageOrder.indexOf(s.stage);
      if (idx < stageOrder.length - 1) return { ...s, stage: stageOrder[idx + 1] };
      return s;
    }));
  };

  const runAIAnalysis = async () => {
    setAiLoading(true);
    const prompt = `Analyze lab sample pipeline status:

Total samples: ${samples.length}
${pipelineStages.map(s => `${s.name}: ${samples.filter(sm => sm.stage === s.id).length} samples`).join("\n")}
Sample details: ${samples.map(s => `${s.id}: ${s.name} (${s.type}) — Stage: ${pipelineStages.find(p => p.id === s.stage)?.name} — Case: ${s.caseId}`).join("; ")}

Provide: throughput optimization recommendations, bottleneck analysis, priority reordering suggestions, and estimated completion times.`;

    const result = await askGemma(prompt, "You are a forensic laboratory operations AI. Optimize sample processing pipelines.");
    setAiResult(result);
    setAiLoading(false);
  };

  const exportPipeline = () => {
    const content = generateForensicReport("Lab Sample Pipeline Report", [
      { heading: "Pipeline Summary", content: pipelineStages.map(s => `  ${s.name}: ${samples.filter(sm => sm.stage === s.id).length} samples`).join("\n") },
      { heading: "All Samples", content: samples.map(s => `  [${s.id}] ${s.name} — Type: ${s.type} — Stage: ${pipelineStages.find(p => p.id === s.stage)?.name} — Case: ${s.caseId} — Submitted: ${new Date(s.submittedAt).toLocaleString()}`).join("\n") || "  No samples in pipeline." },
    ]);
    downloadReport("Lab_Pipeline_Report.txt", content);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-['Space_Grotesk'] tracking-tight">Lab Sample Pipeline</h1>
          <p className="text-slate-500">Track forensic samples through the 5-stage processing pipeline.</p>
        </div>
        <div className="flex items-center gap-3">
          {samples.length > 0 && (
            <>
              <button onClick={exportPipeline} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 font-bold text-sm hover:text-slate-900 transition-all"><Download className="w-4 h-4" /> Export</button>
              <button onClick={runAIAnalysis} disabled={aiLoading} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-100 border border-purple-500/30 text-violet-600 font-bold text-sm hover:bg-violet-200 transition-all disabled:opacity-50">
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />} AI Optimize
              </button>
            </>
          )}
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-900 font-bold text-sm hover:bg-amber-400 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]"><Plus className="w-4 h-4" /> Add Sample</button>
        </div>
      </div>

      {/* Pipeline Stages */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {pipelineStages.map((stage, i) => {
          const stageSamples = samples.filter(s => s.stage === stage.id);
          return (
            <Card key={stage.id} className="bg-white border-white/5">
              <CardHeader className="pb-2">
                <CardTitle className={cn("text-sm flex items-center gap-2", stage.color)}>
                  <stage.icon className="w-4 h-4" /> {stage.name}
                  <span className="ml-auto text-xs font-mono bg-slate-50 hover:bg-slate-100 px-2 py-0.5 rounded">{stageSamples.length}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stageSamples.length > 0 ? stageSamples.map(s => (
                  <div key={s.id} className="p-3 rounded-xl bg-slate-50 border border-white/5 group">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono text-amber-600 font-bold">{s.id}</span>
                      <span className="text-[10px] text-slate-400">{s.caseId}</span>
                    </div>
                    <p className="text-xs text-slate-900 font-medium truncate">{s.name}</p>
                    <p className="text-[10px] text-slate-400">{s.type}</p>
                    {stage.id !== "archive" && (
                      <button onClick={() => advanceStage(s.id)} className="mt-2 w-full py-1 rounded-lg bg-amber-50 border border-amber-500/20 text-[10px] font-bold text-amber-600 hover:bg-amber-100 transition-all flex items-center justify-center gap-1">
                        Advance <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )) : (
                  <p className="text-[10px] text-slate-400 text-center py-4">Empty</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* AI Result */}
      {aiResult && (
        <Card className="bg-white border-white/5">
          <CardHeader><CardTitle className="text-lg text-slate-900 flex items-center gap-2 font-['Space_Grotesk']"><Brain className="w-5 h-5 text-violet-600" /> Gemma AI Pipeline Optimization</CardTitle></CardHeader>
          <CardContent><div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10"><p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{aiResult}</p></div></CardContent>
        </Card>
      )}

      {samples.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FlaskConical className="w-16 h-16 text-gray-700 mb-4" />
          <h3 className="text-lg font-medium text-slate-500">No samples in pipeline</h3>
          <p className="text-sm text-slate-400 mt-1">Click "Add Sample" to begin tracking forensic samples.</p>
        </div>
      )}

      {/* Add Sample Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="bg-white border border-amber-500/30 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><FlaskConical className="w-5 h-5 text-amber-600" />Add Lab Sample</h3>
                <button onClick={() => setShowAdd(false)} className="text-slate-500 hover:text-slate-900"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div><label className="text-xs font-medium text-slate-500 block mb-1">Sample Name *</label><input value={newSample.name} onChange={(e) => setNewSample(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Blood sample from Scene A" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 placeholder-gray-600 text-sm focus:outline-none focus:border-amber-500/50" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-medium text-slate-500 block mb-1">Sample Type</label><select value={newSample.type} onChange={(e) => setNewSample(p => ({ ...p, type: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 text-sm focus:outline-none"><option>Blood</option><option>DNA</option><option>Hair</option><option>Fiber</option><option>Ballistics</option><option>Chemical</option><option>Fingerprint</option><option>Digital</option></select></div>
                  <div><label className="text-xs font-medium text-slate-500 block mb-1">Linked Case</label><select value={newSample.caseId} onChange={(e) => setNewSample(p => ({ ...p, caseId: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 text-sm focus:outline-none"><option value="">Select case...</option>{cases.map(c => <option key={c.id} value={c.id}>{c.id} — {c.title}</option>)}</select></div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 text-sm font-medium transition-all">Cancel</button>
                <button disabled={!newSample.name} onClick={addSample} className="flex-1 py-2.5 rounded-xl bg-amber-500 text-slate-900 font-bold text-sm hover:bg-amber-400 transition-all disabled:opacity-40">Add Sample</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
