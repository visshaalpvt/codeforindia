"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, AlertTriangle, Download, Share2, Shield,
  Activity, Target, ListChecks, Clock, User,
  Hash, MapPin, Calendar, FolderKanban,
} from "lucide-react";
import { cn, formatDateTime, riskColor, riskBgColor, severityColor } from "@/lib/utils";
import { useData } from "@/lib/store";
import { generateSummary, getAICaseContext } from "@/lib/dynamic-data";
import type { AISummary } from "@/types";

function useTypewriter(text: string, speed = 25, start = false) {
  const [displayed, setDisplayed] = useState(0);
  const indexRef = useRef(0);

  useEffect(() => {
    if (!start) {
      setDisplayed(0);
      indexRef.current = 0;
      return;
    }
    indexRef.current = 0;
    setDisplayed(0);
    const interval = setInterval(() => {
      indexRef.current += 1;
      setDisplayed(indexRef.current);
      if (indexRef.current >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, start]);

  return text.slice(0, displayed);
}

function TypewriterSection({ text, delay = 0, start }: { text: string; delay?: number; start: boolean }) {
  const [show, setShow] = useState(false);
  const typewritten = useTypewriter(text, 15, show);

  useEffect(() => {
    if (start) {
      const t = setTimeout(() => setShow(true), delay);
      return () => clearTimeout(t);
    }
    setShow(false);
  }, [start, delay]);

  return <span>{typewritten}</span>;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function AISummaryPage() {
  const { cases, evidence, anomalies, timelineEvents } = useData();
  const [selectedCaseId, setSelectedCaseId] = useState(cases[0]?.id ?? "");
  const caseData = cases.find(c => c.id === selectedCaseId);
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [generating, setGenerating] = useState(false);
  const [phase, setPhase] = useState<"idle" | "analyzing" | "reveal">("idle");

  const handleGenerate = useCallback(async () => {
    if (!caseData) return;
    setGenerating(true);
    setPhase("analyzing");
    
    try {
      const context = getAICaseContext(cases, evidence, anomalies, timelineEvents);
      const prompt = `Generate a high-level, detailed forensic investigative synthesis for Case: ${caseData.title} (${caseData.id}).
      
      CASE CONTEXT:
      ${context}
      
      Based on the sequence of events, anomalies, and evidence provided, provide a detailed summary.
      Return a JSON object with this EXACT structure:
      {
        "summary": "Professional executive summary of the case findings (4-5 paragraphs)",
        "sequence": ["Detailed chronological step 1", "Detailed chronological step 2", ...],
        "suspiciousPatterns": [
          { "pattern": "Description of pattern", "severity": "Low|Medium|High|Critical" }
        ],
        "riskOverview": {
          "score": number (0-100),
          "factors": [
            { "label": "Factor name", "points": number }
          ]
        },
        "recommendedActions": ["Detailed actionable step 1", "Detailed actionable step 2", ...]
      }
      Return ONLY the raw JSON string.`;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: context },
            { role: "user", content: prompt }
          ]
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Try to parse the AI's JSON response
      let aiSummary;
      try {
        const cleanJson = data.content.replace(/```json|```/g, "").trim();
        aiSummary = JSON.parse(cleanJson);
      } catch (e) {
        // Fallback to mock if AI fails to return valid JSON
        console.warn("AI returned invalid JSON, using fallback", e);
        aiSummary = generateSummary(caseData, anomalies, timelineEvents, evidence);
      }

      setSummary({
        ...aiSummary,
        caseId: caseData.id,
        generatedAt: new Date().toISOString()
      });
      setPhase("reveal");
    } catch (error) {
      console.error("AI Generation failed:", error);
      setSummary(generateSummary(caseData, anomalies, timelineEvents, evidence));
      setPhase("reveal");
    } finally {
      setGenerating(false);
    }
  }, [caseData, cases, anomalies, timelineEvents, evidence]);

  return (
    <div className="relative min-h-screen p-4 md:p-6 animate-grid-bg">
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
              <Sparkles className="w-7 h-7 text-cyan-400" />
              AI Investigation Summary
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Automated case synthesis powered by AIVENTRA AI
            </p>
          </div>
        </motion.div>

        {/* Case Selector */}
        <div className="flex items-center gap-3">
          <FolderKanban className="w-4 h-4 text-cyan-400" />
          <select
            value={selectedCaseId}
            onChange={(e) => { setSelectedCaseId(e.target.value); setPhase("idle"); setSummary(null); }}
            className="px-4 py-2 rounded-xl bg-white/5 border border-cyan-500/20 text-white focus:outline-none focus:border-cyan-500/50 text-sm min-w-[200px]"
          >
            <option value="">Select a case...</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>{c.id} — {c.title}</option>
            ))}
          </select>
        </div>

        {caseData && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="backdrop-blur-xl bg-white/5 border border-cyan-500/20 rounded-2xl p-5 md:p-6"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-3 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold border text-red-400 border-red-500/40 bg-red-500/10">
                  {caseData.priority}
                </span>
                <span className="text-xs font-mono text-cyan-400">{caseData.id}</span>
                <span className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-semibold border",
                  caseData.status === "Active"
                    ? "text-green-400 border-green-500/30 bg-green-500/10"
                    : "text-gray-400 border-gray-500/30 bg-gray-500/10",
                )}>
                  {caseData.status}
                </span>
              </div>
              <h2 className="text-lg font-bold">{caseData.title}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-400">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gray-500" />
                  <span className="truncate">{caseData.victim}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gray-500" />
                  <span className="truncate">{caseData.officer}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-500" />
                  <span>{formatDateTime(caseData.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-500" />
                  <span className="truncate">{caseData.location}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Hash className="w-3 h-3" /> {caseData.evidenceCount} evidence items
                </span>
                <span className="flex items-center gap-1">
                  <Activity className="w-3 h-3" /> {caseData.anomalies} anomalies
                </span>
              </div>
            </div>

            {caseData.analyst && (
              <div className="shrink-0 text-right">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Analyst</p>
                <p className="text-sm font-medium text-cyan-300">{caseData.analyst}</p>
              </div>
            )}
          </div>
        </motion.div>
        )}

        {summary?.generatedAt && phase === "reveal" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-xs text-gray-500"
          >
            <Clock className="w-3.5 h-3.5" />
            Last generated: {formatDateTime(summary.generatedAt)}
          </motion.div>
        )}

        {phase === "idle" && caseData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center py-16"
          >
            <button
              onClick={handleGenerate}
              className="group relative px-8 py-4 rounded-2xl font-bold text-lg
                bg-cyan-500/20 text-cyan-300 border border-cyan-400/50
                hover:bg-cyan-500/30 hover:shadow-[0_0_40px_rgba(6,182,212,0.3)]
                transition-all duration-300 flex items-center gap-3"
            >
              <Sparkles className="w-6 h-6" />
              Generate AI Summary
              <span className="absolute inset-0 rounded-2xl bg-cyan-400/5
                group-hover:animate-pulse" />
            </button>
          </motion.div>
        )}

        {phase === "idle" && !caseData && (
          <div className="flex justify-center py-16 text-gray-500">
            <p className="text-sm">Select a case above to generate an AI summary</p>
          </div>
        )}

        <AnimatePresence>
          {phase === "analyzing" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="backdrop-blur-xl bg-white/5 border border-cyan-500/20 rounded-2xl p-8
                flex flex-col items-center justify-center gap-4"
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
                <Sparkles className="w-5 h-5 text-cyan-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-sm text-gray-400 animate-pulse">
                AIVENTRA AI is analyzing case data...
              </p>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-cyan-400"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase === "reveal" && summary && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-5"
            >
              <motion.div
                variants={itemVariants}
                className="backdrop-blur-xl bg-white/5 border border-cyan-500/20 rounded-2xl p-5 md:p-6"
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                    <ListChecks className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-blue-300">
                    Probable Sequence of Events
                  </h2>
                </div>
                <ol className="space-y-3">
                  {summary.sequence.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400
                        flex items-center justify-center text-[11px] font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-gray-300 leading-relaxed">
                        <TypewriterSection
                          text={step}
                          start={phase === "reveal"}
                          delay={i * 600}
                        />
                      </span>
                    </li>
                  ))}
                </ol>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="backdrop-blur-xl bg-white/5 border border-cyan-500/20 rounded-2xl p-5 md:p-6"
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="p-2 rounded-lg bg-red-500/20 text-red-400">
                    <Activity className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-red-300">
                    Suspicious Patterns Identified
                  </h2>
                </div>
                <div className="space-y-3">
                  {summary.suspiciousPatterns.map((sp, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className={cn(
                        "w-1.5 h-full min-h-[2rem] rounded-full shrink-0 mt-0.5",
                        sp.severity === "Critical" ? "bg-red-500" :
                        sp.severity === "High" ? "bg-amber-500" : "bg-yellow-500",
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold border",
                            severityColor(sp.severity),
                          )}>
                            {sp.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300">
                          <TypewriterSection
                            text={sp.pattern}
                            start={phase === "reveal"}
                            delay={i * 400}
                          />
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="backdrop-blur-xl bg-white/5 border border-cyan-500/20 rounded-2xl p-5 md:p-6"
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                    <Shield className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-300">
                    Risk Overview
                  </h2>
                </div>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-24 h-24 rounded-2xl border-2 flex items-center justify-center",
                      riskBgColor(summary.riskOverview.score),
                    )}>
                      <span className={cn(
                        "text-4xl font-bold",
                        riskColor(summary.riskOverview.score),
                      )}>
                        {summary.riskOverview.score}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1.5 uppercase tracking-wider">
                      Overall Risk Score
                    </span>
                  </div>
                  <div className="flex-1 w-full space-y-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                      Contributing Factors
                    </p>
                    {summary.riskOverview.factors.map((f, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="flex-1 h-8 rounded-lg bg-white/5 overflow-hidden flex items-center px-3">
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs text-gray-300">{f.label}</span>
                            <span className="text-xs font-mono text-cyan-400 font-bold">{f.points}</span>
                          </div>
                        </div>
                        <div className="w-16 h-8 rounded-lg bg-white/5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${f.points}%` }}
                            transition={{ duration: 1, delay: 1 + i * 0.2 }}
                            className={cn(
                              "h-full rounded-lg",
                              f.points >= 20 ? "bg-red-500/40" :
                              f.points >= 10 ? "bg-amber-500/40" : "bg-yellow-500/40",
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="backdrop-blur-xl bg-white/5 border border-cyan-500/20 rounded-2xl p-5 md:p-6"
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="p-2 rounded-lg bg-green-500/20 text-green-400">
                    <Target className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-green-300">
                    Recommended Next Actions
                  </h2>
                </div>
                <ol className="space-y-3">
                  {summary.recommendedActions.map((action, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-green-500/20 text-green-400
                        flex items-center justify-center text-[11px] font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-gray-300 leading-relaxed">
                        <TypewriterSection
                          text={action}
                          start={phase === "reveal"}
                          delay={i * 500}
                        />
                      </span>
                    </li>
                  ))}
                </ol>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="backdrop-blur-xl bg-amber-500/5 border border-amber-500/30 rounded-2xl p-4 md:p-5
                  flex items-start gap-3"
              >
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
                    IMPORTANT DISCLAIMER
                  </p>
                  <p className="text-xs text-amber-400/80 leading-relaxed">
                    This summary was generated by AIVENTRA AI and is provided for investigative
                    assistance only. This is NOT a legal conclusion, NOT admissible as court evidence.
                  </p>
                </div>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="flex items-center gap-3 justify-end"
              >
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                  bg-white/5 text-gray-300 border border-white/10
                  hover:bg-white/10 hover:border-cyan-500/30 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Export as PDF
                </button>
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                  bg-cyan-500/20 text-cyan-300 border border-cyan-500/30
                  hover:bg-cyan-500/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  Share with Team
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
