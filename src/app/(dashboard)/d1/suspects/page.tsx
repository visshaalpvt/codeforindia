"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Search, ShieldAlert, MapPin, Plus, Fingerprint, Eye, X, Brain, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useData } from "@/lib/store";
import { askGemma } from "@/lib/gemma";

export default function SuspectTrackerPage() {
  const { cases } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [suspects, setSuspects] = useState<{ id: string; name: string; alias: string; status: string; risk: string; lastLocation: string; offense: string; caseId: string }[]>([]);
  const [newSuspect, setNewSuspect] = useState({ name: "", alias: "", status: "Wanted", risk: "Medium", lastLocation: "", offense: "", caseId: "" });
  const [profileTarget, setProfileTarget] = useState<string | null>(null);
  const [aiProfile, setAiProfile] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const addSuspect = () => {
    if (!newSuspect.name) return;
    setSuspects(prev => [...prev, {
      id: `S-${1000 + prev.length + 1}`,
      ...newSuspect,
      caseId: newSuspect.caseId || cases[0]?.id || "Unlinked",
    }]);
    setNewSuspect({ name: "", alias: "", status: "Wanted", risk: "Medium", lastLocation: "", offense: "", caseId: "" });
    setShowAdd(false);
  };

  const generateProfile = async (suspectId: string) => {
    const s = suspects.find(su => su.id === suspectId);
    if (!s) return;
    setProfileTarget(suspectId);
    setAiLoading(true);
    const caseData = cases.find(c => c.id === s.caseId);
    const prompt = `Generate a forensic intelligence profile for suspect:

Name: ${s.name}
Alias: ${s.alias || "None"}
Status: ${s.status}
Risk Level: ${s.risk}
Last Known Location: ${s.lastLocation}
Primary Offense: ${s.offense}
Linked Case: ${caseData ? `${caseData.id}: ${caseData.title}` : "None"}

Provide: psychological assessment, flight risk analysis, known associates prediction, recommended surveillance approach, and interview strategy.`;

    const result = await askGemma(prompt, "You are a criminal intelligence analyst AI. Generate suspect profiles for law enforcement investigations.");
    setAiProfile(result);
    setAiLoading(false);
  };

  const filtered = suspects.filter(s =>
    !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.id.toLowerCase().includes(searchTerm.toLowerCase()) || s.alias.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-['Space_Grotesk'] tracking-tight">Suspect Tracker</h1>
          <p className="text-gray-400">Manage persons of interest with AI profiling.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-white font-bold text-sm hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]">
          <Plus className="w-4 h-4" /> Add Suspect
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input type="text" placeholder="Search by name, ID, or alias..." className="w-full pl-12 pr-4 py-3 rounded-2xl bg-[#111827] border border-white/5 text-white focus:outline-none focus:border-cyan-500/50" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filtered.map((suspect, i) => (
            <motion.div key={suspect.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="bg-[#111827] border-white/5 hover:border-cyan-500/30 transition-all overflow-hidden group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                        <User className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white font-['Space_Grotesk']">{suspect.name}</h3>
                        {suspect.alias && <p className="text-xs text-cyan-400 uppercase tracking-widest">Alias: {suspect.alias}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[10px] px-2 py-0.5 rounded font-bold border",
                        suspect.status === "In Custody" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                        suspect.status === "Wanted" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                        "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      )}>{suspect.status}</span>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded font-bold border",
                        suspect.risk === "Critical" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                        suspect.risk === "High" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                        "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      )}>{suspect.risk} RISK</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div><p className="text-[10px] text-gray-500 uppercase font-bold"><ShieldAlert className="w-3 h-3 inline mr-1" />Offense</p><p className="text-xs text-white">{suspect.offense}</p></div>
                    <div><p className="text-[10px] text-gray-500 uppercase font-bold"><MapPin className="w-3 h-3 inline mr-1" />Location</p><p className="text-xs text-white truncate">{suspect.lastLocation}</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => generateProfile(suspect.id)} className="flex-1 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs font-bold text-cyan-400 hover:bg-cyan-500/20 transition-all flex items-center justify-center gap-2">
                      <Brain className="w-3.5 h-3.5" /> AI Profile
                    </button>
                    <span className="text-[10px] text-gray-600 font-mono">{suspect.caseId}</span>
                  </div>
                  {profileTarget === suspect.id && (
                    <div className="mt-4 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                      {aiLoading ? <div className="flex items-center justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-cyan-400" /></div> :
                        <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{aiProfile}</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <User className="w-16 h-16 text-gray-700 mb-4" />
          <h3 className="text-lg font-medium text-gray-400">No suspects registered</h3>
          <p className="text-sm text-gray-600 mt-1">Click "Add Suspect" to register a person of interest.</p>
        </div>
      )}

      {/* Add Suspect Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="bg-[#111827] border border-cyan-500/30 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><User className="w-5 h-5 text-cyan-400" />Add Suspect</h3>
                <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div><label className="text-xs font-medium text-gray-400 block mb-1">Full Name *</label><input value={newSuspect.name} onChange={(e) => setNewSuspect(p => ({ ...p, name: e.target.value }))} placeholder="Suspect name" className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-cyan-500/50" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-medium text-gray-400 block mb-1">Alias</label><input value={newSuspect.alias} onChange={(e) => setNewSuspect(p => ({ ...p, alias: e.target.value }))} placeholder="Known alias" className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-cyan-500/50" /></div>
                  <div><label className="text-xs font-medium text-gray-400 block mb-1">Linked Case</label><select value={newSuspect.caseId} onChange={(e) => setNewSuspect(p => ({ ...p, caseId: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/50"><option value="">Select case...</option>{cases.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}</select></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-medium text-gray-400 block mb-1">Status</label><select value={newSuspect.status} onChange={(e) => setNewSuspect(p => ({ ...p, status: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/50"><option>Wanted</option><option>In Custody</option><option>Released</option><option>Unidentified</option></select></div>
                  <div><label className="text-xs font-medium text-gray-400 block mb-1">Risk Level</label><select value={newSuspect.risk} onChange={(e) => setNewSuspect(p => ({ ...p, risk: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/50"><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></div>
                </div>
                <div><label className="text-xs font-medium text-gray-400 block mb-1">Primary Offense</label><input value={newSuspect.offense} onChange={(e) => setNewSuspect(p => ({ ...p, offense: e.target.value }))} placeholder="e.g. Armed Robbery" className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-cyan-500/50" /></div>
                <div><label className="text-xs font-medium text-gray-400 block mb-1">Last Known Location</label><input value={newSuspect.lastLocation} onChange={(e) => setNewSuspect(p => ({ ...p, lastLocation: e.target.value }))} placeholder="Location" className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-cyan-500/50" /></div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white text-sm font-medium transition-all">Cancel</button>
                <button disabled={!newSuspect.name} onClick={addSuspect} className="flex-1 py-2.5 rounded-xl bg-cyan-500 text-white font-bold text-sm hover:bg-cyan-400 transition-all disabled:opacity-40">Add Suspect</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
