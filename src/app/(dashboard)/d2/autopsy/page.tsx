"use client";

import { Suspense, useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Microscope, AlertTriangle, CheckCircle, FileText,
  Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, FolderKanban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useData } from "@/lib/store";
import { generateAIAnalysis, getAICaseContext } from "@/lib/dynamic-data";
import type { AIAnalysisResult } from "@/types";

const FORENSIC_TERMS = [
  "cause of death", "blunt force", "contusion", "subdural hematoma",
  "toxicology", "rigor mortis", "livor mortis", "decomposition",
  "fracture", "defensive wounds", "blood spatter", "gunshot residue",
];


const SEVERITY_COLORS: Record<string, { border: string; bg: string; text: string; accent: string }> = {
  critical: { border: "border-red-500/30", bg: "bg-red-500/5", text: "text-red-400", accent: "bg-red-500/20" },
  high: { border: "border-amber-500/30", bg: "bg-amber-500/5", text: "text-amber-400", accent: "bg-amber-500/20" },
  medium: { border: "border-yellow-500/30", bg: "bg-yellow-500/5", text: "text-yellow-400", accent: "bg-yellow-500/20" },
  low: { border: "border-green-500/30", bg: "bg-green-500/5", text: "text-green-400", accent: "bg-green-500/20" },
};

function highlightTerms(text: string, searchQuery: string): React.ReactNode[] {
  const lines = text.split("\n");
  return lines.map((line, li) => {
    const termMatches: { index: number; term: string }[] = [];
    for (const term of FORENSIC_TERMS) {
      let idx = line.toLowerCase().indexOf(term);
      while (idx !== -1) {
        termMatches.push({ index: idx, term: line.slice(idx, idx + term.length) });
        idx = line.toLowerCase().indexOf(term, idx + 1);
      }
    }
    let searchIdx = -1;
    if (searchQuery) {
      searchIdx = line.toLowerCase().indexOf(searchQuery.toLowerCase());
    }
    const allHighlights: { index: number; length: number; type: "forensic" | "search" }[] = termMatches.map((m) => ({ index: m.index, length: m.term.length, type: "forensic" }));
    if (searchIdx !== -1) {
      allHighlights.push({ index: searchIdx, length: searchQuery.length, type: "search" });
    }
    allHighlights.sort((a, b) => a.index - b.index);

    if (allHighlights.length === 0) {
      return <span key={li}>{line}</span>;
    }

    const parts: React.ReactNode[] = [];
    let cursor = 0;
    for (const h of allHighlights) {
      if (h.index < cursor) continue;
      if (h.index > cursor) {
        parts.push(<span key={`${li}-t${cursor}`}>{line.slice(cursor, h.index)}</span>);
      }
      const highlighted = line.slice(h.index, h.index + h.length);
      parts.push(
        <span
          key={`${li}-h${h.index}`}
          className={cn(
            "rounded px-0.5",
            h.type === "forensic" ? "bg-yellow-500/30 text-yellow-200" : "bg-cyan-500/30 text-cyan-200",
          )}
        >
          {highlighted}
        </span>
      );
      cursor = h.index + h.length;
    }
    if (cursor < line.length) {
      parts.push(<span key={`${li}-e${cursor}`}>{line.slice(cursor)}</span>);
    }
    return <span key={li}>{parts}<br /></span>;
  });
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const color = confidence >= 90 ? "text-green-400 border-green-500/30 bg-green-500/10"
    : confidence >= 75 ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
    : "text-red-400 border-red-500/30 bg-red-500/10";
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", color)}>
      {confidence}% confidence
    </span>
  );
}

function InsightCard({
  title, children, severity = "medium", icon: Icon,
}: {
  title: string; children: React.ReactNode; severity?: string; icon: React.ElementType;
}) {
  const s = SEVERITY_COLORS[severity] ?? SEVERITY_COLORS.medium;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "backdrop-blur-md border rounded-xl p-4 transition-all hover:scale-[1.01]",
        s.border, s.bg,
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("p-1.5 rounded-lg", s.accent)}>
          <Icon className={cn("w-4 h-4", s.text)} />
        </div>
        <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-400">{title}</span>
      </div>
      <div className="text-sm text-gray-200 leading-relaxed">{children}</div>
    </motion.div>
  );
}

function ConfidenceGauge({ percentage, size = 100 }: { percentage: number; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const color = percentage >= 90 ? "#22C55E" : percentage >= 75 ? "#F59E0B" : "#EF4444";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className="absolute text-lg font-bold font-mono" style={{ color }}>{percentage}%</span>
    </div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

function AutopsyPageInner() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [analyzed, setAnalyzed] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rawOpen, setRawOpen] = useState(false);
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [flagged, setFlagged] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState("");

  const { cases, evidence, addTimelineEvent } = useData();

  useEffect(() => {
    const caseId = searchParams.get("caseId");
    if (caseId && cases.find(c => c.id === caseId)) {
      setSelectedCaseId(caseId);
    }
  }, [searchParams, cases]);

  const selectedCase = cases.find(c => c.id === selectedCaseId);

  const startAnalysis = useCallback(async () => {
    if (!selectedCase) return;
    setScanning(true);
    setProgress(0);
    
    // Simulate progress bar while calling API
    const progressInterval = setInterval(() => {
      setProgress(p => Math.min(95, p + (100 - p) * 0.1));
    }, 500);

    try {
      const context = getAICaseContext(cases, evidence, [], []);
      const reportText = userReport || "No autopsy report text provided";
      
      const prompt = `Perform a comprehensive forensic intelligence extraction on the following autopsy report.
      Provide high-precision data with professional medical terminology.
      
      REPORT TEXT:
      ${reportText}
      
      Return a JSON object with this EXACT structure:
      {
        "causeOfDeath": "Detailed medical cause",
        "causeConfidence": number (0-100),
        "injuryType": "Specific injury classification",
        "injuryConfidence": number (0-100),
        "toxicology": "Detailed findings or 'None detected'",
        "weaponClues": "Analysis of wounds suggesting weapon type",
        "bodyCondition": "Description of decomposition/rigor/livor",
        "keyObservations": ["Detailed observation 1", "Detailed observation 2", ...]
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

      let aiAnalysis;
      try {
        const cleanJson = data.content.replace(/```json|```/g, "").trim();
        aiAnalysis = JSON.parse(cleanJson);
      } catch (e) {
        console.warn("AI returned invalid JSON for autopsy, using fallback", e);
        aiAnalysis = generateAIAnalysis(evidence, selectedCase);
      }

      setResult(aiAnalysis);
      setAnalyzed(true);
      
      addTimelineEvent({
        caseId: selectedCase.id,
        timestamp: new Date().toISOString(),
        type: "Evidence Upload",
        title: "AI Autopsy Extraction Completed",
        description: `Extracted cause: ${aiAnalysis.causeOfDeath}`,
        confidence: aiAnalysis.causeConfidence,
      });

    } catch (error) {
      console.error("Autopsy AI analysis failed:", error);
      setResult(generateAIAnalysis(evidence, selectedCase));
      setAnalyzed(true);
    } finally {
      clearInterval(progressInterval);
      setProgress(100);
      setScanning(false);
    }
  }, [evidence, selectedCase, cases, addTimelineEvent]);

  const [userReport, setUserReport] = useState("");

  const reportContent = useMemo(() => {
    const text = userReport || "Paste or type your autopsy report text here to enable AI-powered forensic term highlighting and analysis.";
    return highlightTerms(text, search);
  }, [userReport, search]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white tracking-tight">Autopsy Analysis</h1>
        <p className="text-sm text-gray-400 mt-1">AI-powered forensic report intelligence extraction</p>
      </motion.div>

      {/* Case Selector */}
      <div className="flex items-center gap-3">
        <FolderKanban className="w-4 h-4 text-cyan-400" />
        <select
          value={selectedCaseId}
          onChange={(e) => { setSelectedCaseId(e.target.value); setAnalyzed(false); setResult(null); }}
          className="px-4 py-2 rounded-xl bg-white/5 border border-cyan-500/20 text-white focus:outline-none focus:border-cyan-500/50 text-sm min-w-[200px]"
        >
          <option value="">Select a case...</option>
          {cases.map((c) => (
            <option key={c.id} value={c.id}>{c.id} — {c.title}</option>
          ))}
        </select>
        {selectedCase && (
          <span className="text-xs text-gray-400">
            Victim: {selectedCase.victim} | Officer: {selectedCase.officer}
          </span>
        )}
      </div>

      {!analyzed && !scanning && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center py-16">
          <button
            onClick={startAnalysis}
            disabled={!selectedCase}
            className="group relative px-8 py-4 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 font-semibold text-lg hover:bg-cyan-500/30 transition-all overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="relative z-10 flex items-center gap-3">
              <Microscope className="w-6 h-6" />
              {selectedCase ? "Analyze Report" : "Select a case first"}
            </span>
            {selectedCase && (
              <motion.div
                className="absolute inset-0 bg-cyan-500/10"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </button>
        </motion.div>
      )}

      <AnimatePresence>
        {scanning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="backdrop-blur-md bg-white/5 border border-cyan-500/20 rounded-2xl p-8 text-center"
          >
            <Microscope className="w-12 h-12 text-cyan-400 mx-auto mb-4 animate-pulse" />
            <p className="text-lg font-semibold text-white mb-2">Analyzing Forensic Report...</p>
            <p className="text-sm text-gray-400 mb-6">Extracting patterns, classifying injuries, detecting anomalies</p>
            <div className="max-w-md mx-auto">
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 font-mono">{Math.round(progress)}%</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {analyzed && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* LEFT: Report Viewer */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Original Report</h2>
                </div>
                <span className="text-[10px] text-gray-500 font-mono">Case {selectedCase?.id || "N/A"}</span>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search in document..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-cyan-500/20 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 text-sm"
                />
              </div>

              {/* Report Input */}
              <textarea
                value={userReport}
                onChange={(e) => setUserReport(e.target.value)}
                placeholder="Paste your autopsy report text here...&#10;&#10;The AI will automatically highlight forensic terms like cause of death, blunt force, contusion, toxicology, rigor mortis, livor mortis, defensive wounds, etc."
                rows={6}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-cyan-500/20 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-cyan-500/50 resize-none font-mono"
              />

              {/* Highlighted Report Display */}
              <div className="relative backdrop-blur-md bg-white/[0.03] border border-cyan-500/15 rounded-2xl overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03]" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='g' patternUnits='userSpaceOnUse' width='60' height='60'%3E%3Cpath d='M0 60 L60 0' stroke='white' stroke-width='0.5' fill='none' /%3E%3C/pattern%3E%3C/defs%3E%3Crect width='60' height='60' fill='url(%23g)' /%3E%3C/svg%3E")`,
                }} />
                <div className="relative p-6 min-h-[200px] max-h-[400px] overflow-y-auto font-mono text-xs leading-relaxed text-gray-300 whitespace-pre-wrap">
                  {reportContent}
                </div>
                <div className="relative px-4 py-2 border-t border-cyan-500/10 bg-white/[0.02]">
                  <span className="text-[10px] text-gray-500 font-mono">
                    {userReport ? `${userReport.split(/\s+/).length} words — forensic terms highlighted` : "No report entered"}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* RIGHT: AI Insights */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Microscope className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">AI Forensic Intelligence Extract</h2>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-green-500/30 bg-green-500/10 text-green-400">
                  Processed
                </span>
              </div>

              {result && (
              <div className="space-y-3">
                <InsightCard title="Cause of Death" severity="critical" icon={AlertTriangle}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{result.causeOfDeath}</span>
                    <ConfidenceBadge confidence={result.causeConfidence} />
                  </div>
                </InsightCard>

                <InsightCard title="Injury Type" severity="high" icon={FileText}>
                  <div className="flex items-center justify-between">
                    <span>{result.injuryType}</span>
                    <ConfidenceBadge confidence={result.injuryConfidence} />
                  </div>
                </InsightCard>

                <InsightCard title="Toxicology" severity="medium" icon={Microscope}>
                  <span>{result.toxicology}</span>
                </InsightCard>

                <InsightCard title="Weapon Clues" severity="high" icon={AlertTriangle}>
                  <span>{result.weaponClues}</span>
                </InsightCard>

                <InsightCard title="Body Condition" severity="medium" icon={FileText}>
                  <span>{result.bodyCondition}</span>
                </InsightCard>

                <InsightCard title="Key Observations" severity="low" icon={CheckCircle}>
                  <ul className="space-y-1">
                    {result.keyObservations.map((obs, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-2 text-xs"
                      >
                        <span className="text-cyan-400 mt-0.5">•</span>
                        {obs}
                      </motion.li>
                    ))}
                  </ul>
                </InsightCard>
              </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={startAnalysis}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/30 text-xs font-medium transition-all"
                >
                  <Microscope className="w-3.5 h-3.5" />
                  Re-analyze
                </button>
                <button
                  onClick={() => {
                    if (!selectedCase || !result) return;
                    addTimelineEvent({
                      caseId: selectedCase.id,
                      timestamp: new Date().toISOString(),
                      type: "Evidence Upload",
                      title: "Autopsy Analysis Completed",
                      description: `Cause: ${result.causeOfDeath} (${result.causeConfidence}% confidence)`,
                      confidence: result.causeConfidence,
                    });
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 hover:bg-blue-500/30 text-xs font-medium transition-all"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Add to Case Timeline
                </button>
                <button
                  onClick={() => setFlagged((f) => !f)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-lg border text-xs font-medium transition-all",
                    flagged
                      ? "bg-red-500/30 border-red-500/60 text-red-300"
                      : "bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30",
                  )}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {flagged ? "Flagged for Review" : "Flag for Review"}
                </button>
              </div>

              {/* Raw Extracted Text */}
              <div className="backdrop-blur-md bg-white/5 border border-cyan-500/20 rounded-xl overflow-hidden">
                <button
                  onClick={() => setRawOpen(!rawOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  <span className="font-semibold uppercase tracking-wider">Raw Extracted Text</span>
                  {rawOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                <AnimatePresence>
                  {rawOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <pre className="p-4 text-[10px] text-gray-500 font-mono whitespace-pre-wrap border-t border-cyan-500/10 max-h-48 overflow-y-auto">
                        {JSON.stringify(result!, null, 2)}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AutopsyPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="w-8 h-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" /></div>}>
      <AutopsyPageInner />
    </Suspense>
  );
}
