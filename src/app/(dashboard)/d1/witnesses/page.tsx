"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, ShieldCheck, MessageSquare, Phone, Plus, X, FileText, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useData } from "@/lib/store";
import { downloadReport, generateForensicReport } from "@/lib/download";

export default function WitnessManagerPage() {
  const { cases } = useData();
  const [showAdd, setShowAdd] = useState(false);
  const [witnesses, setWitnesses] = useState<{ id: string; name: string; type: string; status: string; reliability: string; statement: string; caseId: string }[]>([]);
  const [newWitness, setNewWitness] = useState({ name: "", type: "Eyewitness", status: "Active", reliability: "Medium", statement: "", caseId: "" });

  const addWitness = () => {
    if (!newWitness.name || !newWitness.statement) return;
    setWitnesses(prev => [...prev, { id: `W-${550 + prev.length + 1}`, ...newWitness, caseId: newWitness.caseId || cases[0]?.id || "Unlinked" }]);
    setNewWitness({ name: "", type: "Eyewitness", status: "Active", reliability: "Medium", statement: "", caseId: "" });
    setShowAdd(false);
  };

  const exportStatement = (w: typeof witnesses[0]) => {
    const content = generateForensicReport(`Witness Statement — ${w.id}`, [
      { heading: "Witness Information", content: `  ID: ${w.id}\n  Name: ${w.name}\n  Type: ${w.type}\n  Status: ${w.status}\n  Reliability: ${w.reliability}\n  Linked Case: ${w.caseId}` },
      { heading: "Statement", content: `  "${w.statement}"` },
    ]);
    downloadReport(`${w.id}_Statement.txt`, content);
  };

  const protectedCount = witnesses.filter(w => w.status === "Protected").length;
  const activeCount = witnesses.filter(w => w.status === "Active").length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-['Space_Grotesk'] tracking-tight">Witness Manager</h1>
          <p className="text-slate-500">Manage witness statements, protection protocols, and testimony scheduling.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-slate-900 font-bold text-sm hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]">
          <Plus className="w-4 h-4" /> Register Witness
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-white/5 border-l-4 border-l-green-500">
          <CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-xs text-slate-400 uppercase font-bold mb-1">Protected</p><p className="text-2xl font-bold text-slate-900 font-mono">{protectedCount}</p></div><ShieldCheck className="w-8 h-8 text-green-500/50" /></div></CardContent>
        </Card>
        <Card className="bg-white border-white/5 border-l-4 border-l-amber-500">
          <CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-xs text-slate-400 uppercase font-bold mb-1">Active</p><p className="text-2xl font-bold text-slate-900 font-mono">{activeCount}</p></div><MessageSquare className="w-8 h-8 text-amber-500/50" /></div></CardContent>
        </Card>
        <Card className="bg-white border-white/5 border-l-4 border-l-cyan-500">
          <CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-xs text-slate-400 uppercase font-bold mb-1">Total Witnesses</p><p className="text-2xl font-bold text-slate-900 font-mono">{witnesses.length}</p></div><User className="w-8 h-8 text-violet-600/50" /></div></CardContent>
        </Card>
      </div>

      {witnesses.length > 0 ? (
        <div className="space-y-4">
          {witnesses.map((witness, i) => (
            <motion.div key={witness.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="bg-white border-white/5 hover:bg-slate-50 hover:bg-slate-100 transition-all group">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-violet-50 border border-slate-300 flex items-center justify-center">
                        <User className="w-6 h-6 text-violet-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900 font-['Space_Grotesk']">{witness.name}</h3>
                          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border",
                            witness.status === "Protected" ? "bg-green-500/10 text-green-600 border-green-500/20" :
                            witness.status === "Active" ? "bg-amber-50 text-amber-600 border-amber-500/20" :
                            "bg-violet-50 text-violet-600 border-slate-200"
                          )}>{witness.status}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {witness.type}</span>
                          <span className="font-mono">{witness.id}</span>
                          <span>Linked: <span className="text-violet-600 font-bold">{witness.caseId}</span></span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 max-w-md">
                      <p className="text-sm text-slate-500 italic line-clamp-2">"{witness.statement}"</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right mr-4 hidden lg:block">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Reliability</p>
                        <span className={cn("text-xs font-bold",
                          witness.reliability === "Critical" ? "text-red-600" :
                          witness.reliability === "High" ? "text-green-600" : "text-amber-600"
                        )}>{witness.reliability}</span>
                      </div>
                      <button onClick={() => exportStatement(witness)} className="px-4 py-2 rounded-lg bg-violet-50 border border-slate-200 text-xs font-bold text-violet-600 hover:bg-violet-100 transition-all flex items-center gap-2">
                        <Download className="w-3.5 h-3.5" /> Export
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <User className="w-16 h-16 text-gray-700 mb-4" />
          <h3 className="text-lg font-medium text-slate-500">No witnesses registered</h3>
          <p className="text-sm text-slate-400 mt-1">Click "Register Witness" to add a new witness record.</p>
        </div>
      )}

      {/* Add Witness Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="bg-white border border-slate-300 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><User className="w-5 h-5 text-violet-600" />Register Witness</h3>
                <button onClick={() => setShowAdd(false)} className="text-slate-500 hover:text-slate-900"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div><label className="text-xs font-medium text-slate-500 block mb-1">Full Name *</label><input value={newWitness.name} onChange={(e) => setNewWitness(p => ({ ...p, name: e.target.value }))} placeholder="Witness name" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 placeholder-gray-600 text-sm focus:outline-none focus:border-slate-400" /></div>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="text-xs font-medium text-slate-500 block mb-1">Type</label><select value={newWitness.type} onChange={(e) => setNewWitness(p => ({ ...p, type: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 text-sm focus:outline-none"><option>Eyewitness</option><option>Informant</option><option>Expert Witness</option><option>Character Witness</option></select></div>
                  <div><label className="text-xs font-medium text-slate-500 block mb-1">Status</label><select value={newWitness.status} onChange={(e) => setNewWitness(p => ({ ...p, status: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 text-sm focus:outline-none"><option>Active</option><option>Protected</option><option>Verified</option></select></div>
                  <div><label className="text-xs font-medium text-slate-500 block mb-1">Case</label><select value={newWitness.caseId} onChange={(e) => setNewWitness(p => ({ ...p, caseId: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 text-sm focus:outline-none"><option value="">Select...</option>{cases.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}</select></div>
                </div>
                <div><label className="text-xs font-medium text-slate-500 block mb-1">Statement *</label><textarea value={newWitness.statement} onChange={(e) => setNewWitness(p => ({ ...p, statement: e.target.value }))} placeholder="Witness statement..." rows={3} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 placeholder-gray-600 text-sm focus:outline-none focus:border-slate-400 resize-none" /></div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 text-sm font-medium transition-all">Cancel</button>
                <button disabled={!newWitness.name || !newWitness.statement} onClick={addWitness} className="flex-1 py-2.5 rounded-xl bg-cyan-500 text-slate-900 font-bold text-sm hover:bg-cyan-400 transition-all disabled:opacity-40">Register</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
