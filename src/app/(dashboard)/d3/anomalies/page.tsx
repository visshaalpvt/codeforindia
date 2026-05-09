"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, Clock, FileText, MapPin, MessageSquare,
  Footprints, Link2, WifiOff, X, CheckCircle, Flag,
  Search, Filter, ChevronDown,
} from "lucide-react";
import { cn, timeAgo, severityColor } from "@/lib/utils";
import { useData } from "@/lib/store";
import type { Anomaly, AnomalySeverity, AnomalyType } from "@/types";

const typeIconMap: Record<AnomalyType, React.ElementType> = {
  "Timestamp Mismatch": Clock,
  "Metadata Conflict": FileText,
  "GPS Gap": MapPin,
  "Contradictory Statements": MessageSquare,
  "Unusual Movement Pattern": Footprints,
  "Missing Evidence Chain": Link2,
  "Comm Blackout": WifiOff,
};

const severityOrder: AnomalySeverity[] = ["Critical", "High", "Medium", "Low"];
const anomalyTypes: AnomalyType[] = [
  "Timestamp Mismatch", "Metadata Conflict", "GPS Gap",
  "Contradictory Statements", "Unusual Movement Pattern",
  "Missing Evidence Chain", "Comm Blackout",
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

function StatCard({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: number;
  color: string;
  sub?: string;
}) {
  return (
    <motion.div
      variants={itemVariants}
      className="backdrop-blur-md bg-white/5 border border-cyan-500/20 rounded-2xl p-4"
    >
      <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={cn("text-2xl font-bold mt-1 font-sans", color)}>{value}</p>
      {sub && <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>}
    </motion.div>
  );
}

function SeverityBadge({ severity }: { severity: AnomalySeverity }) {
  return (
    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border", severityColor(severity))}>
      {severity}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "Unresolved" ? "text-red-400 border-red-500/30 bg-red-500/10" :
    status === "Under Investigation" ? "text-amber-400 border-amber-500/30 bg-amber-500/10" :
    status === "Confirmed" ? "text-blue-400 border-blue-500/30 bg-blue-500/10" :
    status === "False Positive" ? "text-green-400 border-green-500/30 bg-green-500/10" :
    "text-purple-400 border-purple-500/30 bg-purple-500/10";
  return (
    <span className={cn("px-2 py-0.5 rounded text-[10px] font-semibold border", color)}>
      {status}
    </span>
  );
}

function AnomalyCard({
  anomaly,
  onResolve,
  onFlag,
}: {
  anomaly: Anomaly;
  onResolve: (a: Anomaly) => void;
  onFlag: (a: Anomaly) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = typeIconMap[anomaly.type] ?? AlertTriangle;

  return (
    <motion.div
      layout
      variants={itemVariants}
      className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 hover:border-cyan-500/30 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={cn(
            "p-2.5 rounded-xl shrink-0",
            anomaly.severity === "Critical" ? "bg-red-500/20 text-red-400" :
            anomaly.severity === "High" ? "bg-amber-500/20 text-amber-400" :
            anomaly.severity === "Medium" ? "bg-yellow-500/20 text-yellow-400" :
            "bg-green-500/20 text-green-400",
          )}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <SeverityBadge severity={anomaly.severity} />
              <span className="text-[11px] font-mono text-cyan-400">{anomaly.id}</span>
              <StatusBadge status={anomaly.status} />
            </div>
            <h3 className="text-sm font-semibold mt-1.5">{anomaly.title}</h3>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">{anomaly.description}</p>

            <div className="mt-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                AI Explanation
                <ChevronDown className={cn("w-3 h-3 transition-transform", expanded && "rotate-180")} />
              </button>
              <AnimatePresence>
                {expanded && (
                  <motion.p
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="text-[11px] text-gray-500 mt-1 leading-relaxed overflow-hidden"
                  >
                    {anomaly.aiExplanation}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-3 mt-2.5 flex-wrap text-[11px] text-gray-500">
              <div className="flex items-center gap-1.5">
                {anomaly.evidenceIds.map((eid) => (
                  <span key={eid} className="font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                    {eid}
                  </span>
                ))}
              </div>
              <span>{timeAgo(anomaly.detectedAt)}</span>
              <span className="font-mono">{anomaly.confidence}% confidence</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
        <button
          onClick={() => onResolve(anomaly)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium
            bg-green-500/10 text-green-400 border border-green-500/20
            hover:bg-green-500/20 transition-colors"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          Mark Resolved
        </button>
        <button
          onClick={() => onFlag(anomaly)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium
            bg-amber-500/10 text-amber-400 border border-amber-500/20
            hover:bg-amber-500/20 transition-colors"
        >
          <Flag className="w-3.5 h-3.5" />
          Flag for Review
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium
          bg-white/5 text-gray-400 border border-white/10
          hover:bg-white/10 transition-colors ml-auto"
        >
          View Details
        </button>
      </div>
    </motion.div>
  );
}

function ResolveDialog({
  anomaly,
  onClose,
  onResolve,
}: {
  anomaly: Anomaly;
  onClose: () => void;
  onResolve: (id: string, resolution: string, comment: string) => void;
}) {
  const [resolution, setResolution] = useState("");
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    if (!resolution) return;
    onResolve(anomaly.id, resolution, comment);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="backdrop-blur-xl bg-gray-900/90 border border-cyan-500/30 rounded-2xl p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Resolve Anomaly</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          {anomaly.id} &mdash; {anomaly.title}
        </p>

        <div className="space-y-2 mb-4">
          {["False Positive", "Under Investigation", "Confirmed", "Escalated"].map((opt) => (
            <button
              key={opt}
              onClick={() => setResolution(opt)}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-xl text-sm border transition-all",
                resolution === opt
                  ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300"
                  : "border-white/10 bg-white/[0.02] text-gray-400 hover:border-white/20",
              )}
            >
              {opt}
            </button>
          ))}
        </div>

        <textarea
          placeholder="Mandatory comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10
            text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:border-cyan-500/50
            mb-4"
          rows={3}
        />

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-white/10
              text-gray-400 hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!resolution || !comment.trim()}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium
              bg-cyan-500/20 text-cyan-400 border border-cyan-500/30
              hover:bg-cyan-500/30 transition-colors
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Confirm
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DetectionTimeline({ anomalies }: { anomalies: Anomaly[] }) {
  const sorted = [...anomalies].sort(
    (a, b) => new Date(a.detectedAt).getTime() - new Date(b.detectedAt).getTime(),
  );

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex items-center gap-0 min-w-[500px]">
        {sorted.map((a, idx) => {
          const color =
            a.severity === "Critical" ? "bg-red-500" :
            a.severity === "High" ? "bg-amber-500" :
            a.severity === "Medium" ? "bg-yellow-500" :
            "bg-green-500";
          return (
            <div key={a.id} className="flex items-center gap-0 flex-1">
              <div className="flex flex-col items-center">
                <div className={cn("w-2.5 h-2.5 rounded-full", color)} />
                <span className="text-[8px] text-gray-500 mt-0.5 font-mono whitespace-nowrap">
                  {new Date(a.detectedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              </div>
              {idx < sorted.length - 1 && (
                <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-white/5 mx-1" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AnomaliesPage() {
  const { anomalies, updateAnomaly, deleteAnomaly, addAnomaly } = useData();
  const [selectedSeverities, setSelectedSeverities] = useState<AnomalySeverity[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<AnomalyType[]>([]);
  const [showUnresolved, setShowUnresolved] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [resolvingAnomaly, setResolvingAnomaly] = useState<Anomaly | null>(null);
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const severityCounts = useMemo(() => ({
    total: anomalies.length,
    Critical: anomalies.filter((a) => a.severity === "Critical").length,
    High: anomalies.filter((a) => a.severity === "High").length,
    Medium: anomalies.filter((a) => a.severity === "Medium").length,
    Low: anomalies.filter((a) => a.severity === "Low").length,
  }), [anomalies]);

  const filteredAnomalies = useMemo(() => {
    return anomalies.filter((a) => {
      if (selectedSeverities.length > 0 && !selectedSeverities.includes(a.severity)) return false;
      if (selectedTypes.length > 0 && !selectedTypes.includes(a.type)) return false;
      if (showUnresolved && a.status !== "Unresolved") return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q) ||
          a.evidenceIds.some((eid) => eid.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [anomalies, selectedSeverities, selectedTypes, showUnresolved, searchQuery]);

  const handleResolve = (id: string, resolution: string, comment: string) => {
    updateAnomaly(id, { status: resolution as Anomaly["status"] });
  };

  const handleFlag = (anomaly: Anomaly) => {
    updateAnomaly(anomaly.id, { status: "Under Investigation" });
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      next.add(anomaly.id);
      return next;
    });
  };

  const toggleSeverity = (s: AnomalySeverity) => {
    setSelectedSeverities((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  const toggleType = (t: AnomalyType) => {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  };

  return (
    <div className="relative min-h-screen p-4 md:p-6 space-y-6 animate-grid-bg">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Anomaly Detection Center
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            AI-flagged irregularities across evidence, timelines, and statements.
          </p>
        </div>
        <motion.div
          animate={{ rotate: flaggedIds.size > 0 ? [0, -10, 10, -10, 0] : 0 }}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-bold border backdrop-blur-sm",
            flaggedIds.size > 0
              ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
              : "text-gray-500 border-white/10 bg-white/5",
          )}
        >
          {flaggedIds.size} Flagged
        </motion.div>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <StatCard label="Total Anomalies" value={severityCounts.total} color="text-cyan-400" />
        <StatCard label="Critical" value={severityCounts.Critical} color="text-red-400" sub="Immediate action required" />
        <StatCard label="High" value={severityCounts.High} color="text-amber-400" sub="Requires investigation" />
        <StatCard label="Medium" value={severityCounts.Medium} color="text-yellow-400" sub="Monitor" />
      </motion.div>

      <div className="backdrop-blur-md bg-white/5 border border-cyan-500/20 rounded-2xl p-4 md:p-6">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
          Timeline of Detection
        </h2>
        <DetectionTimeline anomalies={anomalies} />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search anomalies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/5 border border-white/10
              text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors",
            showFilters
              ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
              : "bg-white/5 text-gray-400 border-white/10 hover:border-white/20",
          )}
        >
          <Filter className="w-3.5 h-3.5" />
          Filters
          {(selectedSeverities.length > 0 || selectedTypes.length > 0 || showUnresolved) && (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          )}
        </button>
        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showUnresolved}
            onChange={() => setShowUnresolved(!showUnresolved)}
            className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 accent-cyan-400"
          />
          Unresolved only
        </label>
        {(selectedSeverities.length > 0 || selectedTypes.length > 0) && (
          <button
            onClick={() => { setSelectedSeverities([]); setSelectedTypes([]); setShowUnresolved(false); }}
            className="text-xs text-gray-500 hover:text-gray-300"
          >
            Clear all
          </button>
        )}
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Severity</p>
                <div className="flex flex-wrap gap-2">
                  {severityOrder.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleSeverity(s)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all",
                        selectedSeverities.includes(s)
                          ? cn("border-cyan-500/40 bg-cyan-500/10 text-cyan-300")
                          : "border-white/10 text-gray-400 hover:border-white/20",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Type</p>
                <div className="flex flex-wrap gap-2">
                  {anomalyTypes.map((t) => {
                    const TIcon = typeIconMap[t];
                    return (
                      <button
                        key={t}
                        onClick={() => toggleType(t)}
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all",
                          selectedTypes.includes(t)
                            ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                            : "border-white/10 text-gray-400 hover:border-white/20",
                        )}
                      >
                        <TIcon className="w-3 h-3" />
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        key={`${selectedSeverities.join(",")}-${selectedTypes.join(",")}-${showUnresolved}-${searchQuery}`}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {filteredAnomalies.length === 0 ? (
          <div className="md:col-span-2 text-center py-12 text-gray-500 text-sm">
            No anomalies match the current filters.
          </div>
        ) : (
          filteredAnomalies.map((anomaly) => (
            <AnomalyCard
              key={anomaly.id}
              anomaly={anomaly}
              onResolve={setResolvingAnomaly}
              onFlag={handleFlag}
            />
          ))
        )}
      </motion.div>

      <AnimatePresence>
        {resolvingAnomaly && (
          <ResolveDialog
            anomaly={resolvingAnomaly}
            onClose={() => setResolvingAnomaly(null)}
            onResolve={handleResolve}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
