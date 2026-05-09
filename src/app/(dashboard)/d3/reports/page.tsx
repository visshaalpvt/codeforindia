"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  CalendarDays,
  ShieldCheck,
  Upload,
  AlertTriangle,
  Activity,
  ChevronDown,
  FileDown,
  Printer,
  Share2,
  CheckCircle,
  Loader2,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { useData } from "@/lib/store";
import { generateForensicReport, downloadReport, downloadCSV } from "@/lib/download";
import type { Case } from "@/types";

interface ReportType {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
}

const reportTypes: ReportType[] = [
  { id: "full-case", label: "Full Case Report", icon: FileText, description: "Complete case details with all evidence" },
  { id: "timeline", label: "Timeline Report", icon: CalendarDays, description: "Chronological event sequence" },
  { id: "audit-trail", label: "Audit Trail Report", icon: ShieldCheck, description: "Chain of custody and access logs" },
  { id: "evidence-summary", label: "Evidence Summary", icon: Upload, description: "All evidence with classifications" },
  { id: "anomaly", label: "Anomaly Report", icon: AlertTriangle, description: "AI-flagged irregularities" },
  { id: "risk-analysis", label: "Risk Analysis Report", icon: Activity, description: "Risk scores and threat assessment" },
];

interface SectionCheckbox {
  id: string;
  label: string;
}

const sections: SectionCheckbox[] = [
  { id: "case-details", label: "Case Details" },
  { id: "evidence-list", label: "Evidence List" },
  { id: "timeline", label: "Timeline" },
  { id: "anomalies", label: "Anomalies" },
  { id: "risk-analysis", label: "Risk Analysis" },
  { id: "ai-summary", label: "AI Summary" },
];

const watermarks = ["CONFIDENTIAL", "DRAFT", "FOR REVIEW", "OFFICIAL"];

interface RecentExport {
  name: string;
  type: string;
  generatedBy: string;
  date: string;
  status: "Generated" | "Pending" | "Error";
}

function useRecentExports(): RecentExport[] {
  const { cases, anomalies } = useData();
  return useMemo(() => {
    const exports: RecentExport[] = [];
    const reportTypes = ["Full Case", "Timeline", "Anomaly", "Evidence Summary", "Audit Trail"];
    const statuses: ("Generated" | "Pending" | "Error")[] = ["Generated", "Pending", "Error"];
    const names = ["Dr. Arjun Mehta", "Inspector Vikram Joshi", "Tech. Ravi Verma", "Inspector Priya Sharma"];
    cases.forEach((c, i) => {
      const type = reportTypes[i % reportTypes.length];
      exports.push({
        name: `${c.id}_${type.replace(/\s+/g, "_")}_Report.pdf`,
        type,
        generatedBy: names[i % names.length],
        date: new Date(Date.now() - i * 86400000).toISOString(),
        status: statuses[i % statuses.length],
      });
    });
    if (anomalies.length > 0) {
      exports.push({
        name: `ANOMALY_ALERT_${new Date().toISOString().slice(0, 10)}.pdf`,
        type: "Anomaly",
        generatedBy: "AI System",
        date: new Date().toISOString(),
        status: "Generated",
      });
    }
    return exports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [cases, anomalies]);
}

const statusColor: Record<string, string> = {
  Generated: "bg-green-500/15 text-green-600 border-green-500/30",
  Pending: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  Error: "bg-red-500/15 text-red-600 border-red-500/30",
};

function PreviewPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-slate-400">
      <FileText className="w-16 h-16 mb-3 opacity-30" />
      <p className="text-sm">Select report type and generate a report to preview</p>
      <p className="text-xs text-slate-400 mt-1">Configure options on the left and click Generate Report</p>
    </div>
  );
}

function GeneratedPreview({
  reportType,
  caseId,
  watermark,
  cases,
}: {
  reportType: ReportType;
  caseId: string;
  watermark: string;
  cases: Case[];
}) {
  const selectedCase = cases.find((c) => c.id === caseId);
  const ReportIcon = reportType.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-xl p-6 shadow-xl min-h-[400px] relative overflow-hidden"
    >
      {watermark && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <span
            className="text-[120px] font-bold text-gray-200/30 rotate-[-30deg] tracking-widest"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {watermark}
          </span>
        </div>
      )}

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
          <div className="p-2 rounded-lg bg-cyan-100">
            <ReportIcon className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">{reportType.label}</h3>
            <p className="text-[10px] text-slate-400 font-mono">{caseId}</p>
          </div>
        </div>

        {selectedCase && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Case Title</p>
                <p className="text-xs font-semibold text-gray-900">{selectedCase.title}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Victim</p>
                <p className="text-xs text-gray-800">{selectedCase.victim}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Officer</p>
                <p className="text-xs text-gray-800">{selectedCase.officer}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Priority</p>
                <p className="text-xs font-semibold text-gray-900">{selectedCase.priority}</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Description</p>
              <p className="text-xs text-gray-700 leading-relaxed">
                This report provides a comprehensive analysis of {selectedCase.title}. The investigation
                involves {selectedCase.evidenceCount} evidence items with {selectedCase.anomalies} flagged
                anomalies. Risk assessment score: {selectedCase.riskScore}/100.
              </p>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Key Findings</p>
              <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
                <li>Evidence tampering detected in chain of custody logs</li>
                <li>GPS data shows unexplained location discrepancies</li>
                <li>Witness statements conflict with forensic timeline</li>
                <li>AI analysis recommends further investigation</li>
              </ul>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <p className="text-[10px] text-slate-500 font-mono">
                Generated: {formatDate(new Date().toISOString())} | {watermark || "No watermark"}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function ReportsPage() {
  const { cases, evidence, anomalies } = useData();
  const recentExports = useRecentExports();
  const [selectedReport, setSelectedReport] = useState<string>("full-case");
  const [selectedCase, setSelectedCase] = useState(cases[0]?.id ?? "");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedSections, setSelectedSections] = useState<Set<string>>(
    new Set(sections.map((s) => s.id))
  );
  const [redact, setRedact] = useState(false);
  const [watermark, setWatermark] = useState("CONFIDENTIAL");
  const [generating, setGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(false);

  const report = useMemo(
    () => reportTypes.find((r) => r.id === selectedReport)!,
    [selectedReport]
  );

  const toggleSection = (id: string) => {
    setSelectedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGeneratedReport(true);
    }, 2000);
  };

  const handleDownload = () => {
    const c = cases.find(cs => cs.id === selectedCase);
    if (!c) return;
    const caseEvidence = evidence.filter(e => e.caseId === c.id);
    const caseAnomalies = anomalies.filter(a => a.caseId === c.id);
    const sections: { heading: string; content: string }[] = [];

    sections.push({ heading: "Case Details", content: `  Case ID: ${c.id}\n  Title: ${c.title}\n  Victim: ${c.victim}\n  Officer: ${c.officer}\n  Type: ${c.type}\n  Priority: ${c.priority}\n  Status: ${c.status}\n  Risk Score: ${c.riskScore}/100\n  Location: ${c.location}\n  Created: ${c.createdAt}` });
    sections.push({ heading: "Evidence Summary", content: caseEvidence.length > 0 ? caseEvidence.map(e => `  [${e.id}] ${e.name} — Type: ${e.type} — Status: ${e.custodyStatus}`).join("\n") : "  No evidence items linked to this case." });
    sections.push({ heading: "Anomalies", content: caseAnomalies.length > 0 ? caseAnomalies.map(a => `  [${a.severity}] ${a.title} — ${a.description}`).join("\n") : "  No anomalies detected for this case." });
    sections.push({ heading: "Risk Assessment", content: `  Composite Risk Score: ${c.riskScore}/100\n  Evidence Count: ${c.evidenceCount}\n  Flagged Anomalies: ${c.anomalies}\n  Assessment: ${c.riskScore > 75 ? "CRITICAL — Immediate escalation recommended" : c.riskScore > 50 ? "ELEVATED — Enhanced monitoring required" : "NORMAL — Standard protocols sufficient"}` });

    const content = generateForensicReport(`${report.label} — ${c.id}`, sections);
    downloadReport(`${c.id}_${report.id}_Report.txt`, content);
  };

  const handleCSVExport = () => {
    const headers = ["Case ID", "Title", "Victim", "Officer", "Type", "Priority", "Status", "Risk Score", "Location"];
    const rows = cases.map(c => [c.id, c.title, c.victim, c.officer, c.type, c.priority, c.status, String(c.riskScore), c.location || ""]);
    downloadCSV("AIVENTRA_Cases_Export.csv", headers, rows);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reports & Export</h1>
        <p className="text-sm text-slate-500 mt-1">Generate, preview, and export case reports</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-5">
          <div className="glass rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
              Report Type
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {reportTypes.map((rt) => {
                const RIcon = rt.icon;
                const isActive = selectedReport === rt.id;
                return (
                  <button
                    key={rt.id}
                    onClick={() => setSelectedReport(rt.id)}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-xl border text-left transition-all",
                      isActive
                        ? "bg-violet-50 border-slate-300"
                        : "bg-slate-50 border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-lg shrink-0",
                        isActive ? "bg-violet-100 text-violet-600" : "bg-slate-50 hover:bg-slate-100 text-slate-500"
                      )}
                    >
                      <RIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p
                        className={cn(
                          "text-xs font-semibold",
                          isActive ? "text-violet-700" : "text-slate-700"
                        )}
                      >
                        {rt.label}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{rt.description}</p>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 mt-1.5 ml-auto" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="glass rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Configuration
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Case</label>
                <select
                  value={selectedCase}
                  onChange={(e) => setSelectedCase(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs
                    focus:outline-none focus:border-slate-400 cursor-pointer appearance-none"
                >
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} — {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs
                      focus:outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs
                      focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-2">Include Sections</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {sections.map((s) => (
                  <label
                    key={s.id}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer transition-all",
                      selectedSections.has(s.id)
                        ? "bg-violet-50 border-slate-300 text-violet-700"
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSections.has(s.id)}
                      onChange={() => toggleSection(s.id)}
                      className="w-3 h-3 rounded border-slate-300 bg-slate-50 hover:bg-slate-100 accent-cyan-400"
                    />
                    {s.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-white/5">
                <span className="text-xs text-slate-700">Redact sensitive information</span>
                <button
                  onClick={() => setRedact(!redact)}
                  className={cn(
                    "relative w-10 h-5 rounded-full transition-colors",
                    redact ? "bg-cyan-500" : "bg-gray-600"
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm",
                      redact ? "translate-x-5" : "translate-x-0.5"
                    )}
                  />
                </button>
              </label>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Watermark</label>
                <select
                  value={watermark}
                  onChange={(e) => setWatermark(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs
                    focus:outline-none focus:border-slate-400 cursor-pointer appearance-none"
                >
                  <option value="">None</option>
                  {watermarks.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 italic">
              Role-based access: Reports will include investigator, forensic analyst, and medical officer signatures based on user role.
            </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full py-3 rounded-xl bg-violet-100 border border-slate-300 text-violet-600
              hover:bg-violet-200 text-sm font-semibold transition-all flex items-center justify-center gap-2
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating report...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Generate Report
              </>
            )}
          </button>
        </div>

        <div className="lg:col-span-2">
          <div className="glass rounded-2xl p-4 h-full flex flex-col">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
              Preview
            </h2>
            <div className="flex-1 min-h-[400px]">
              {generatedReport ? (
                <GeneratedPreview
                  reportType={report}
                  caseId={selectedCase}
                  watermark={watermark}
                  cases={cases}
                />
              ) : (
                <PreviewPlaceholder />
              )}
            </div>
            {generatedReport && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-200">
                <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 border border-slate-300 text-violet-600 hover:bg-cyan-500/25 text-[11px] font-medium transition-all">
                  <FileDown className="w-3.5 h-3.5" />
                  Download
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-medium transition-all">
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-medium transition-all">
                  <Share2 className="w-3.5 h-3.5" />
                  Share with Team
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-medium transition-all">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Submit to Case Record
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-5 pb-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
            Recent Exports
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5 text-slate-400">
                <th className="text-left px-5 py-3 font-medium uppercase tracking-wider">Report Name</th>
                <th className="text-left px-5 py-3 font-medium uppercase tracking-wider">Type</th>
                <th className="text-left px-5 py-3 font-medium uppercase tracking-wider">Generated By</th>
                <th className="text-left px-5 py-3 font-medium uppercase tracking-wider">Date</th>
                <th className="text-left px-5 py-3 font-medium uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 font-medium uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentExports.map((exp, idx) => (
                <motion.tr
                  key={`${exp.name}-${idx}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border-b border-white/5 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                      <span className="text-slate-700 font-medium">{exp.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{exp.type}</td>
                  <td className="px-5 py-3 text-slate-500">{exp.generatedBy}</td>
                  <td className="px-5 py-3 text-slate-500 font-mono">{formatDate(exp.date)}</td>
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-semibold border",
                        statusColor[exp.status]
                      )}
                    >
                      {exp.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {exp.status === "Generated" && (
                      <button onClick={() => {
                        const c = cases.find(cs => cs.id.includes(exp.name.split('_')[0]));
                        const content = generateForensicReport(exp.type + ' Report', [{ heading: 'Report', content: `  Report: ${exp.name}\n  Type: ${exp.type}\n  Generated by: ${exp.generatedBy}\n  Date: ${exp.date}\n  Status: ${exp.status}` }]);
                        downloadReport(exp.name.replace('.pdf', '.txt'), content);
                      }} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-50 border border-slate-300 text-violet-600 hover:bg-violet-100 text-[10px] font-medium transition-all">
                        <Download className="w-3 h-3" />
                        Download
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
