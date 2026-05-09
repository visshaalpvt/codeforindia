"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  FileText, File, Image, Video, Table, MapPin,
  Shield, ShieldOff, Clock, AlertTriangle,
  CheckCircle, XCircle, ChevronRight,
  FileDigit, Search, UserCheck, UserX,
} from "lucide-react";
import { cn, formatDate, formatTime, timeAgo } from "@/lib/utils";
import { useData } from "@/lib/store";
import type { EvidenceItem, CustodyRecord, EvidenceType, CustodyStatus, Role } from "@/types";

const typeIcon: Record<EvidenceType, React.ElementType> = {
  PDF: FileText,
  DOCX: File,
  Image,
  Video,
  CSV: Table,
  GPS: MapPin,
};

const statusStyle: Record<CustodyStatus, string> = {
  Secured: "text-green-400 border-green-500/30 bg-green-500/10",
  "In Lab": "text-blue-400 border-blue-500/30 bg-blue-500/10",
  "In Transit": "text-amber-400 border-amber-500/30 bg-amber-500/10",
  Compromised: "text-red-400 border-red-500/30 bg-red-500/10",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

function EvidenceCard({
  evidence,
  selected,
  onClick,
}: {
  evidence: EvidenceItem;
  selected: boolean;
  onClick: () => void;
}) {
  const Icon = typeIcon[evidence.type] ?? File;
  return (
    <motion.div
      variants={itemVariants}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
        selected
          ? "border-cyan-500/40 bg-cyan-500/10"
          : "border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10",
      )}
    >
      <div className={cn(
        "p-2 rounded-lg shrink-0",
        selected ? "bg-cyan-500/20 text-cyan-400" : "bg-white/5 text-gray-400",
      )}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{evidence.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-mono text-cyan-400">{evidence.id}</span>
          <span className="text-[10px] text-gray-500">{evidence.size}</span>
        </div>
      </div>
      <span className={cn(
        "px-2 py-0.5 rounded text-[10px] font-semibold border shrink-0",
        statusStyle[evidence.custodyStatus],
      )}>
        {evidence.custodyStatus}
      </span>
    </motion.div>
  );
}

function getTimelineDotColor(action: string): string {
  const lower = action.toLowerCase();
  if (lower.includes("collect") || lower.includes("secured")) return "bg-green-500 border-green-500/40";
  if (lower.includes("transfer")) return "bg-amber-500 border-amber-500/40";
  if (lower.includes("lab") || lower.includes("analyz") || lower.includes("analysis")) return "bg-blue-500 border-blue-500/40";
  return "bg-cyan-500 border-cyan-500/40";
}

function ChainTimeline({ records }: { records: CustodyRecord[] }) {
  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No custody records for this evidence.
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-[13px] top-2 bottom-2 w-px bg-gradient-to-b from-cyan-500/40 to-transparent" />
      <div className="space-y-5">
        {records.map((record, idx) => (
          <motion.div
            key={record.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="relative pl-10"
          >
            <div className={cn(
              "absolute left-0 top-1 w-7 h-7 rounded-full border-2 flex items-center justify-center",
              getTimelineDotColor(record.action),
            )}>
              {record.verified
                ? <CheckCircle className="w-3 h-3 text-green-400" />
                : <XCircle className="w-3 h-3 text-red-400" />
              }
            </div>
            <div className="backdrop-blur-sm bg-white/[0.03] border border-white/5 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{record.action}</p>
                <span className={cn(
                  "flex items-center gap-1 text-[10px] font-medium",
                  record.verified ? "text-green-400" : "text-red-400",
                )}>
                  {record.verified
                    ? <><CheckCircle className="w-3 h-3" /> Verified</>
                    : <><XCircle className="w-3 h-3" /> Unverified</>
                  }
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                <UserCheck className="w-3 h-3 shrink-0" />
                <span>{record.person}</span>
                <span className="text-gray-600">({record.role})</span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(record.timestamp)} {formatTime(record.timestamp)}
                </span>
                <span>{record.location}</span>
              </div>
              {record.signature && (
                <p className="mt-1 text-[10px] text-gray-600 font-mono">Sig: {record.signature}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function AccessLogsTable({ records }: { records: CustodyRecord[] }) {
  if (records.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 text-sm">
        No access logs available.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 text-xs uppercase tracking-wider border-b border-white/5">
            <th className="pb-2 font-medium">Timestamp</th>
            <th className="pb-2 font-medium">User</th>
            <th className="pb-2 font-medium">Role</th>
            <th className="pb-2 font-medium">Action</th>
            <th className="pb-2 font-medium">Evidence ID</th>
            <th className="pb-2 font-medium">Verified</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record, idx) => (
            <motion.tr
              key={record.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.04 }}
              className="border-b border-white/[0.02] hover:bg-white/[0.02]"
            >
              <td className="py-2.5 pr-3 text-[11px] font-mono text-gray-400 whitespace-nowrap">
                {formatDate(record.timestamp)} {formatTime(record.timestamp)}
              </td>
              <td className="py-2.5 pr-3 text-xs font-medium">{record.person}</td>
              <td className="py-2.5 pr-3 text-xs text-gray-400">{record.role}</td>
              <td className="py-2.5 pr-3 text-xs">{record.action}</td>
              <td className="py-2.5 pr-3 text-[11px] font-mono text-cyan-400">{record.evidenceId}</td>
              <td className="py-2.5">
                {record.verified
                  ? <CheckCircle className="w-4 h-4 text-green-400" />
                  : <XCircle className="w-4 h-4 text-red-400" />
                }
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AlertCard({ icon: Icon, title, description, color }: {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        "backdrop-blur-md border rounded-xl p-4 flex items-start gap-3",
        color,
      )}
    >
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-gray-400 mt-1">{description}</p>
      </div>
    </motion.div>
  );
}

export default function CustodyPage() {
  const { evidence, custodyRecords: allCustodyRecords, addCustodyRecord } = useData();
  const [selectedId, setSelectedId] = useState<string>(evidence[0]?.id ?? "");
  const [showAddForm, setShowAddForm] = useState(false);
  const [formPerson, setFormPerson] = useState("");
  const [formAction, setFormAction] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formRole, setFormRole] = useState<Role>("Investigator");

  const selectedEvidence = useMemo(
    () => evidence.find((e) => e.id === selectedId),
    [selectedId, evidence],
  );

  const custodyRecords = useMemo(
    () => allCustodyRecords.filter((r) => r.evidenceId === selectedId),
    [selectedId, allCustodyRecords],
  );

  const handleAddRecord = () => {
    if (!formPerson.trim() || !formAction.trim() || !formLocation.trim()) return;
    addCustodyRecord({
      evidenceId: selectedId,
      action: formAction.trim(),
      person: formPerson.trim(),
      role: formRole,
      location: formLocation.trim(),
      timestamp: new Date().toISOString(),
      verified: true,
    });
    setFormPerson("");
    setFormAction("");
    setFormLocation("");
    setFormRole("Investigator");
    setShowAddForm(false);
  };

  const suspiciousAlerts = useMemo(() => {
    const alerts: { icon: React.ElementType; title: string; description: string; color: string }[] = [];
    if (selectedId === "E-004") {
      alerts.push({
        icon: AlertTriangle,
        title: "Evidence #E-004 accessed outside authorized hours",
        description: "Access attempt logged at 03:15 AM on Jan 15, 2025. Investigation recommended.",
        color: "border-red-500/40 bg-red-500/10",
      });
    }
    const unverified = custodyRecords.filter((r) => !r.verified);
    if (unverified.length > 0) {
      alerts.push({
        icon: ShieldOff,
        title: "Unauthorized access attempt logged",
        description: `${unverified.length} unverified custody record(s) detected for ${selectedId}.`,
        color: "border-amber-500/40 bg-amber-500/10",
      });
    }
    return alerts;
  }, [selectedId, custodyRecords]);

  const evidenceStats = useMemo(() => ({
    total: evidence.length,
    secured: evidence.filter((e) => e.custodyStatus === "Secured").length,
    inLab: evidence.filter((e) => e.custodyStatus === "In Lab").length,
    inTransit: evidence.filter((e) => e.custodyStatus === "In Transit").length,
    compromised: evidence.filter((e) => e.custodyStatus === "Compromised").length,
  }), [evidence]);

  return (
    <div className="relative min-h-screen p-4 md:p-6 space-y-6 animate-grid-bg">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Evidence Integrity & Chain of Custody
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Track, verify, and audit evidence handling across all cases.
        </p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: "Total Evidence", value: evidenceStats.total, color: "text-cyan-400" },
          { label: "Secured", value: evidenceStats.secured, color: "text-green-400" },
          { label: "In Lab / Transit", value: evidenceStats.inLab + evidenceStats.inTransit, color: "text-amber-400" },
          { label: "Compromised", value: evidenceStats.compromised, color: "text-red-400" },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            variants={itemVariants}
            className="backdrop-blur-md bg-white/5 border border-cyan-500/20 rounded-2xl p-4"
          >
            <p className="text-xs text-gray-400 uppercase tracking-wider">{stat.label}</p>
            <p className={cn("text-2xl font-bold mt-1 font-sans", stat.color)}>{stat.value}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-md bg-white/5 border border-cyan-500/20 rounded-2xl p-4 md:p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Evidence Items</h2>
              <Search className="w-4 h-4 text-gray-500" />
            </div>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-2 max-h-[600px] overflow-y-auto pr-1"
            >
              {evidence.map((item) => (
                <EvidenceCard
                  key={item.id}
                  evidence={item}
                  selected={item.id === selectedId}
                  onClick={() => setSelectedId(item.id)}
                />
              ))}
            </motion.div>
          </motion.div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {selectedEvidence && (
            <>
              <motion.div
                key={selectedId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="backdrop-blur-md bg-white/5 border border-cyan-500/20 rounded-2xl p-4 md:p-6"
              >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                        Chain of Custody
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {selectedEvidence.name} &middot; {selectedEvidence.id}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium
                          bg-cyan-500/10 text-cyan-400 border border-cyan-500/20
                          hover:bg-cyan-500/20 transition-colors"
                      >
                        Add Record
                      </button>
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[11px] font-semibold border",
                        statusStyle[selectedEvidence.custodyStatus],
                      )}>
                        {selectedEvidence.custodyStatus}
                      </span>
                    </div>
                  </div>
                  {showAddForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3"
                    >
                      <input
                        type="text"
                        placeholder="Person name"
                        value={formPerson}
                        onChange={(e) => setFormPerson(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10
                          text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                      />
                      <input
                        type="text"
                        placeholder="Action (e.g. Transferred to Lab)"
                        value={formAction}
                        onChange={(e) => setFormAction(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10
                          text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                      />
                      <input
                        type="text"
                        placeholder="Location"
                        value={formLocation}
                        onChange={(e) => setFormLocation(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10
                          text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                      />
                      <select
                        value={formRole}
                        onChange={(e) => setFormRole(e.target.value as Role)}
                        className="w-full px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10
                          text-gray-200 focus:outline-none focus:border-cyan-500/50"
                      >
                        <option value="Investigator">Investigator</option>
                        <option value="Forensic Analyst">Forensic Analyst</option>
                        <option value="Medical Officer">Medical Officer</option>
                        <option value="Admin">Admin</option>
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowAddForm(false)}
                          className="flex-1 px-3 py-2 rounded-lg text-xs font-medium border border-white/10
                            text-gray-400 hover:bg-white/5 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddRecord}
                          disabled={!formPerson.trim() || !formAction.trim() || !formLocation.trim()}
                          className="flex-1 px-3 py-2 rounded-lg text-xs font-medium
                            bg-cyan-500/20 text-cyan-400 border border-cyan-500/30
                            hover:bg-cyan-500/30 transition-colors
                            disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Save Record
                        </button>
                      </div>
                    </motion.div>
                  )}
                  <ChainTimeline records={custodyRecords} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="backdrop-blur-md bg-white/5 border border-cyan-500/20 rounded-2xl p-4 md:p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Access Logs
                  </h2>
                  <FileDigit className="w-4 h-4 text-gray-500" />
                </div>
                <AccessLogsTable records={custodyRecords} />
              </motion.div>

              {suspiciousAlerts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Alerts
                  </h2>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-3"
                  >
                    {suspiciousAlerts.map((alert, idx) => (
                      <AlertCard key={idx} {...alert} />
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
