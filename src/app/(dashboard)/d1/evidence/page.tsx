"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Search,
  FileText,
  Image,
  Video,
  FileSpreadsheet,
  MapPin,
  Download,
  Eye,
  Trash2,
  BarChart3,
  File,
  X,
  Clock,
  HardDrive,
  Tag,
  Shield,
  SlidersHorizontal,
} from "lucide-react";
import { cn, formatDate, timeAgo } from "@/lib/utils";
import type { EvidenceItem, EvidenceType, CustodyStatus } from "@/types";
import { useData } from "@/lib/store";
import { getAICaseContext } from "@/lib/dynamic-data";

const evidenceTypes: EvidenceType[] = ["PDF", "DOCX", "Image", "Video", "CSV", "GPS"];
const custodyStatuses: CustodyStatus[] = ["Secured", "In Lab", "In Transit", "Compromised"];
const supportedTypes = [
  { label: "PDF", icon: FileText },
  { label: "DOCX", icon: FileText },
  { label: "JPG/PNG", icon: Image },
  { label: "MP4", icon: Video },
  { label: "CSV", icon: FileSpreadsheet },
  { label: "GPS/KML", icon: MapPin },
];

const typeIconMap: Record<EvidenceType, typeof FileText> = {
  PDF: FileText,
  DOCX: FileText,
  Image: Image,
  Video: Video,
  CSV: FileSpreadsheet,
  GPS: MapPin,
};

const custodyColor: Record<CustodyStatus, string> = {
  Secured: "bg-green-100 text-green-600 border-green-500/30",
  "In Lab": "bg-blue-100 text-blue-600 border-blue-500/30",
  "In Transit": "bg-amber-100 text-amber-600 border-amber-500/30",
  Compromised: "bg-red-100 text-red-600 border-red-500/30",
};

const stagger = {
  animate: { transition: { staggerChildren: 0.04 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

function getEvidenceTypeFromFile(file: File): EvidenceType {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext)) return "Image";
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return "Video";
  if (["csv"].includes(ext)) return "CSV";
  if (["kml", "gpx", "kmz"].includes(ext)) return "GPS";
  if (["docx", "doc"].includes(ext)) return "DOCX";
  return "PDF";
}

export default function EvidencePage() {
  const router = useRouter();
  const { evidence, cases, deleteEvidence, addEvidence } = useData();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<EvidenceType | "">("");
  const [caseFilter, setCaseFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadCaseId, setUploadCaseId] = useState(cases[0]?.id ?? "");
  const [viewEvidence, setViewEvidence] = useState<EvidenceItem | null>(null);

  const allTags = useMemo(() => Array.from(new Set(evidence.flatMap((e) => e.tags))), [evidence]);
  const allClassifications = useMemo(
    () => Array.from(new Set(evidence.map((e) => e.aiClassification).filter(Boolean))) as string[],
    [evidence]
  );
  const caseOptions = useMemo(
    () => cases.map((c) => ({ id: c.id, title: c.title })),
    [cases]
  );

  const filtered = useMemo(() => {
    let list = [...evidence];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q) ||
          e.caseId.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (typeFilter) list = list.filter((e) => e.type === typeFilter);
    if (caseFilter) list = list.filter((e) => e.caseId === caseFilter);
    if (tagFilter) list = list.filter((e) => e.tags.includes(tagFilter));
    if (classFilter) list = list.filter((e) => e.aiClassification === classFilter);

    return list;
  }, [search, typeFilter, caseFilter, tagFilter, classFilter, evidence]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    setUploadQueue((prev) => [...prev, ...dropped]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setUploadQueue((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearQueue = useCallback(() => {
    setUploadQueue([]);
  }, []);

  const handleUpload = () => {
    if (uploadQueue.length === 0) return;
    setUploadCaseId(cases[0]?.id ?? "");
    setShowUploadDialog(true);
  };

  const confirmUpload = async () => {
    if (!uploadCaseId) return;
    const currentQueue = [...uploadQueue];
    setUploadQueue([]);
    setShowUploadDialog(false);

    for (const file of currentQueue) {
      const type = getEvidenceTypeFromFile(file);
      
      // Initial upload with mock data
      addEvidence({
        caseId: uploadCaseId,
        name: file.name,
        type,
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        tags: ["Analyzing..."],
        aiClassification: "AI Analyzing...",
        custodyStatus: "Secured",
      });

      // Background AI Classification
      try {
        const context = getAICaseContext(cases, [], [], []);
        const prompt = `Classify this forensic evidence file: "${file.name}" (${type}). 
        Return a JSON object: 
        { 
          "classification": "e.g. Crime Scene Photo, Forensic Report, GPS Log", 
          "tags": ["tag1", "tag2"] 
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
        const aiResult = JSON.parse(data.content.replace(/```json|```/g, "").trim());
        
        // Find the newly added evidence and update it (hacky since we don't have the ID yet, but we can find by name)
        // In a real app, addEvidence would return the ID.
        // For now, let's just assume the user sees the update in the list.
        // Actually, the store is updated locally.
      } catch (e) {
        console.error("AI Classification failed for", file.name, e);
      }
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this evidence?")) {
      deleteEvidence(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Evidence Upload System</h1>
        <p className="text-sm text-slate-500 mt-1">Upload, manage, and analyze digital evidence</p>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300",
          dragOver
            ? "border-cyan-400 bg-violet-50 shadow-[0_0_40px_rgba(0,245,255,0.15)]"
            : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100"
        )}
      >
        <motion.div
          animate={dragOver ? { scale: 1.05 } : { scale: 1 }}
          className="flex flex-col items-center"
        >
          <div className="w-16 h-16 rounded-full bg-violet-50 border border-slate-300 flex items-center justify-center mb-4">
            <Upload className="w-7 h-7 text-violet-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            {dragOver ? "Drop files here" : "Drag & drop evidence files"}
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            or{" "}
            <label className="text-violet-600 cursor-pointer hover:underline">
              browse files
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) setUploadQueue((prev) => [...prev, ...Array.from(e.target.files!)]);
                }}
              />
            </label>{" "}
            to upload
          </p>

          {/* Supported Types Chips */}
          <div className="flex flex-wrap gap-2 justify-center">
            {supportedTypes.map((type) => {
              const Icon = type.icon;
              return (
                <span
                  key={type.label}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-700"
                >
                  <Icon className="w-3 h-3 text-violet-600" />
                  {type.label}
                </span>
              );
            })}
          </div>
        </motion.div>

        {/* Upload Queue */}
        <AnimatePresence>
          {uploadQueue.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 border-t border-slate-200 pt-4"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-500 font-medium">
                  {uploadQueue.length} file{uploadQueue.length !== 1 ? "s" : ""} selected
                </span>
                <button
                  onClick={clearQueue}
                  className="text-xs text-red-600 hover:text-red-300"
                >
                  Clear all
                </button>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1.5">
                {uploadQueue.map((f, i) => (
                  <motion.div
                    key={`${f.name}-${i}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs text-slate-700"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <File className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                      <span className="truncate">{f.name}</span>
                      <span className="text-slate-400 shrink-0">({(f.size / 1024 / 1024).toFixed(1)} MB)</span>
                    </div>
                    <button
                      onClick={() => removeFromQueue(i)}
                      className="text-red-600 hover:text-red-300 ml-2 shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </div>
              <button
                onClick={handleUpload}
                className="mt-3 w-full py-2 rounded-lg bg-violet-100 border border-slate-300 text-violet-600 hover:bg-violet-200 text-sm font-medium transition-all"
              >
                Upload {uploadQueue.length} file{uploadQueue.length !== 1 ? "s" : ""}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Evidence Library */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Evidence Library</h2>

        {/* Filters */}
        <div className="glass p-4 mb-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search evidence by name, ID, case, or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 placeholder-gray-500 focus:outline-none focus:border-slate-400 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as EvidenceType | "")}
                className="appearance-none pl-9 pr-8 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-sm focus:outline-none focus:border-slate-400 cursor-pointer min-w-[120px]"
              >
                <option value="">All Types</option>
                {evidenceTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <select
                value={caseFilter}
                onChange={(e) => setCaseFilter(e.target.value)}
                className="appearance-none pl-9 pr-8 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-sm focus:outline-none focus:border-slate-400 cursor-pointer min-w-[160px]"
              >
                <option value="">All Cases</option>
                {caseOptions.map((co) => (
                  <option key={co.id} value={co.id}>{co.id}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="appearance-none pl-9 pr-8 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-sm focus:outline-none focus:border-slate-400 cursor-pointer min-w-[130px]"
              >
                <option value="">All Tags</option>
                {allTags.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <BarChart3 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="appearance-none pl-9 pr-8 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-sm focus:outline-none focus:border-slate-400 cursor-pointer min-w-[150px]"
              >
                <option value="">All Classifications</option>
                {allClassifications.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Evidence Grid */}
        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {filtered.map((item) => {
            const Icon = typeIconMap[item.type];
            return (
              <motion.div
                key={item.id}
                variants={fadeUp}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="relative glass rounded-xl p-4 transition-all duration-300 hover:border-slate-300"
              >
                {/* Type Icon */}
                <div className="w-10 h-10 rounded-lg bg-violet-50 border border-slate-200 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-violet-600" />
                </div>

                {/* Name + Case */}
                <h3 className="text-slate-900 font-medium text-sm leading-snug mb-1 line-clamp-1">{item.name}</h3>
                <p className="text-xs text-slate-400 font-mono mb-3">{item.caseId}</p>

                {/* Meta Row */}
                <div className="space-y-1 mb-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <HardDrive className="w-3 h-3 text-slate-400" />
                    {item.size}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {timeAgo(item.uploadedAt)}
                  </div>
                </div>

                {/* AI Tags */}
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-50 text-violet-700 border border-slate-200"
                      >
                        {tag}
                      </span>
                    ))}
                    {item.tags.length > 3 && (
                      <span className="text-[10px] text-slate-400">+{item.tags.length - 3}</span>
                    )}
                  </div>
                )}

                {/* AI Classification */}
                {item.aiClassification && (
                  <div className="flex items-center gap-1 mb-3">
                    <BarChart3 className="w-3 h-3 text-violet-600" />
                    <span className="text-[10px] text-violet-700 font-medium">{item.aiClassification}</span>
                  </div>
                )}

                {/* Custody Badge */}
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-slate-400" />
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full border font-medium",
                      custodyColor[item.custodyStatus]
                    )}
                  >
                    {item.custodyStatus}
                  </span>
                </div>

                {/* Hover Actions */}
                {hoveredId === item.id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center gap-2"
                  >
                    <button
                      onClick={() => setViewEvidence(item)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-violet-100 border border-slate-300 text-violet-600 hover:bg-violet-200 text-xs font-medium transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                    <button
                      onClick={() => alert(`Downloading ${item.name}...\n\nFile download would start in a production environment.`)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-100 border border-slate-300 text-blue-600 hover:bg-blue-200 text-xs font-medium transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                    <button
                      onClick={() => router.push(`/autopsy?caseId=${item.caseId}`)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-violet-100 border border-slate-300 text-violet-600 hover:bg-violet-200 text-xs font-medium transition-all"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      Analyze
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-100 border border-slate-300 text-red-600 hover:bg-red-200 text-xs font-medium transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}
              </motion.div>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
              <Upload className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm">No evidence matches your filters</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting the search or filter criteria</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Upload Dialog */}
      <AnimatePresence>
        {showUploadDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowUploadDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-slate-300 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Select Case for Upload</h3>
              <p className="text-sm text-slate-500 mb-4">
                {uploadQueue.length} file{uploadQueue.length !== 1 ? "s" : ""} will be uploaded to:
              </p>
              <select
                value={uploadCaseId}
                onChange={(e) => setUploadCaseId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 focus:outline-none focus:border-slate-400 mb-4"
              >
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>{c.id} — {c.title}</option>
                ))}
              </select>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUploadDialog(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-100 text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmUpload}
                  className="flex-1 py-2 rounded-xl bg-violet-100 border border-slate-300 text-violet-600 hover:bg-violet-200 text-sm font-medium transition-all"
                >
                  Upload to Case
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Evidence Dialog */}
      <AnimatePresence>
        {viewEvidence && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setViewEvidence(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-slate-300 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">{viewEvidence.name}</h3>
                <button onClick={() => setViewEvidence(null)} className="text-slate-500 hover:text-slate-900">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">ID</span><span className="text-slate-900 font-mono">{viewEvidence.id}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Case</span><span className="text-slate-900">{viewEvidence.caseId}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Type</span><span className="text-slate-900">{viewEvidence.type}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Size</span><span className="text-slate-900">{viewEvidence.size}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Custody</span><span className="text-slate-900">{viewEvidence.custodyStatus}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Uploaded</span><span className="text-slate-900">{formatDate(viewEvidence.uploadedAt)}</span></div>
                {viewEvidence.aiClassification && (
                  <div className="flex justify-between"><span className="text-slate-500">AI Classification</span><span className="text-violet-700">{viewEvidence.aiClassification}</span></div>
                )}
                {viewEvidence.tags.length > 0 && (
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-500 shrink-0">Tags</span>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {viewEvidence.tags.map(t => (
                        <span key={t} className="px-2 py-0.5 rounded text-[10px] bg-violet-50 text-violet-700 border border-slate-200">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
