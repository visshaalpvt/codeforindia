"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Upload,
  FileText,
  Save,
  Send,
  Calendar,
  MapPin,
  User,
  Hash,
  Tag,
  Microscope,
  Stethoscope,
  FileEdit,
  Shield,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import type { CaseType, Priority, EvidenceType } from "@/types";
import { useData } from "@/lib/store";

const caseTypes: CaseType[] = ["Homicide", "Accident", "Missing Person", "Cybercrime", "Other"];
const priorities: { value: Priority; label: string }[] = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
  { value: "Critical", label: "Critical" },
];
const genderOptions = ["Male", "Female", "Other"];

const caseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  caseId: z.string().min(1, "Case ID is required"),
  type: z.enum(["Homicide", "Accident", "Missing Person", "Cybercrime", "Other"]),
  priority: z.enum(["Low", "Medium", "High", "Critical"]),
  incidentDate: z.string().min(1, "Incident date is required"),
  incidentTime: z.string().min(1, "Incident time is required"),
  location: z.string().optional(),
  victimName: z.string().min(2, "Victim name is required"),
  victimAge: z.string().optional(),
  victimGender: z.enum(["Male", "Female", "Other"]).optional(),
  assignedOfficer: z.string().min(2, "Officer name is required"),
  forensicAnalyst: z.string().optional(),
  medicalOfficer: z.string().optional(),
  notes: z.string().optional(),
});

type CaseFormData = z.output<typeof caseSchema>;

function getEvidenceTypeFromFile(file: File): EvidenceType {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext)) return "Image";
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return "Video";
  if (["csv"].includes(ext)) return "CSV";
  if (["kml", "gpx", "kmz"].includes(ext)) return "GPS";
  if (["docx", "doc"].includes(ext)) return "DOCX";
  return "PDF";
}

export default function CreateCasePage() {
  const router = useRouter();
  const { addCase, addEvidence } = useData();
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CaseFormData>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      caseId: `CI-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999)).padStart(3, "0")}`,
      priority: "Medium",
      type: "Homicide",
      incidentDate: new Date().toISOString().split("T")[0],
      incidentTime: new Date().toTimeString().slice(0, 5),
    },
  });

  const watchType = watch("type");
  const watchPriority = watch("priority");

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
    setFiles((prev) => [...prev, ...dropped]);
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const createCaseAndEvidence = (data: CaseFormData) => {
    addCase({
      title: data.title,
      victim: data.victimName,
      victimAge: data.victimAge ? parseInt(data.victimAge) : undefined,
      victimGender: data.victimGender,
      officer: data.assignedOfficer,
      analyst: data.forensicAnalyst,
      medicalOfficer: data.medicalOfficer,
      type: data.type,
      priority: data.priority,
      riskScore: 0,
      status: "Active",
      location: data.location,
      evidenceCount: files.length,
      anomalies: 0,
      notes: data.notes,
    });

    for (const file of files) {
      addEvidence({
        caseId: data.caseId,
        name: file.name,
        type: getEvidenceTypeFromFile(file),
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        tags: [],
        custodyStatus: "Secured",
      });
    }
  };

  const onSubmit = async (data: CaseFormData) => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1200));
    createCaseAndEvidence(data);
    setSaving(false);
    setShowSuccess(true);
    setTimeout(() => router.push("/cases"), 2000);
  };

  const onSaveDraft = async (data: CaseFormData) => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    createCaseAndEvidence(data);
    setSaving(false);
    setShowSuccess(true);
    setTimeout(() => router.push("/cases"), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create New Case</h1>
          <p className="text-sm text-gray-400 mt-1">Enter case details and evidence information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="glass rounded-xl p-6 space-y-5">
            <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Case Information
            </h2>

            {/* Case Title */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Case Title</label>
              <input
                {...register("title")}
                placeholder="e.g. Industrial District Homicide"
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-cyan-500/20 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 text-sm"
              />
              {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
            </div>

            {/* Case ID */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium flex items-center gap-1">
                <Hash className="w-3 h-3" />
                Case ID
              </label>
              <input
                {...register("caseId")}
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-cyan-500/20 text-cyan-400 font-mono text-sm focus:outline-none focus:border-cyan-500/50"
                readOnly
              />
            </div>

            {/* Case Type */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium flex items-center gap-1">
                <Tag className="w-3 h-3" />
                Case Type
              </label>
              <div className="flex flex-wrap gap-2">
                {caseTypes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setValue("type", t as any, { shouldValidate: true })}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                      watchType === t
                        ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                        : "bg-white/5 border-cyan-500/10 text-gray-400 hover:border-cyan-500/30"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {errors.type && <p className="text-red-400 text-xs mt-1">{errors.type.message}</p>}
            </div>

            {/* Priority Level */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Priority Level</label>
              <div className="flex rounded-lg overflow-hidden border border-cyan-500/20">
                {priorities.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setValue("priority", p.value, { shouldValidate: true })}
                    className={cn(
                      "flex-1 py-2 text-xs font-semibold transition-all",
                      watchPriority === p.value
                        ? p.value === "Critical"
                          ? "bg-red-500/20 text-red-400"
                          : p.value === "High"
                          ? "bg-amber-500/20 text-amber-400"
                          : p.value === "Medium"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-green-500/20 text-green-400"
                        : "bg-white/5 text-gray-500 hover:bg-white/10"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {errors.priority && <p className="text-red-400 text-xs mt-1">{errors.priority.message}</p>}
            </div>

            {/* Incident Date/Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Incident Date
                </label>
                <input
                  type="date"
                  {...register("incidentDate")}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-cyan-500/20 text-white focus:outline-none focus:border-cyan-500/50 text-sm"
                />
                {errors.incidentDate && <p className="text-red-400 text-xs mt-1">{errors.incidentDate.message}</p>}
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Time</label>
                <input
                  type="time"
                  {...register("incidentTime")}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-cyan-500/20 text-white focus:outline-none focus:border-cyan-500/50 text-sm"
                />
                {errors.incidentTime && <p className="text-red-400 text-xs mt-1">{errors.incidentTime.message}</p>}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Location
              </label>
              <input
                {...register("location")}
                placeholder="e.g. Sector 7, Industrial Area"
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-cyan-500/20 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 text-sm"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="glass rounded-xl p-6 space-y-5">
            <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4" />
              People & Notes
            </h2>

            {/* Victim Name */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Victim Name</label>
              <input
                {...register("victimName")}
                placeholder="Full name of the victim"
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-cyan-500/20 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 text-sm"
              />
              {errors.victimName && <p className="text-red-400 text-xs mt-1">{errors.victimName.message}</p>}
            </div>

            {/* Victim Age + Gender */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Age</label>
                <input
                  type="number"
                  {...register("victimAge")}
                  placeholder="e.g. 34"
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-cyan-500/20 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Gender</label>
                <select
                  {...register("victimGender")}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-cyan-500/20 text-gray-300 focus:outline-none focus:border-cyan-500/50 text-sm"
                >
                  <option value="">Select</option>
                  {genderOptions.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Assigned Officer */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Assigned Officer
              </label>
              <input
                {...register("assignedOfficer")}
                placeholder="e.g. Inspector Priya Sharma"
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-cyan-500/20 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 text-sm"
              />
              {errors.assignedOfficer && <p className="text-red-400 text-xs mt-1">{errors.assignedOfficer.message}</p>}
            </div>

            {/* Forensic Analyst + Medical Officer */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium flex items-center gap-1">
                  <Microscope className="w-3 h-3" />
                  Forensic Analyst
                </label>
                <input
                  {...register("forensicAnalyst")}
                  placeholder="e.g. Dr. Arjun Mehta"
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-cyan-500/20 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium flex items-center gap-1">
                  <Stethoscope className="w-3 h-3" />
                  Medical Officer
                </label>
                <input
                  {...register("medicalOfficer")}
                  placeholder="e.g. Dr. Kavita Singh"
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-cyan-500/20 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 text-sm"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium flex items-center gap-1">
                <FileEdit className="w-3 h-3" />
                Notes
              </label>
              <textarea
                {...register("notes")}
                rows={3}
                placeholder="Preliminary observations, case details, etc."
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-cyan-500/20 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 text-sm resize-none"
              />
            </div>

            {/* Initial Evidence Upload */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium flex items-center gap-1">
                <Upload className="w-3 h-3" />
                Initial Evidence Upload
              </label>
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={cn(
                  "relative border-2 border-dashed rounded-xl p-6 text-center transition-all",
                  dragOver
                    ? "border-cyan-400 bg-cyan-500/10"
                    : "border-cyan-500/30 bg-white/[0.02] hover:border-cyan-500/50"
                )}
              >
                <Upload className="w-8 h-8 text-cyan-400/60 mx-auto mb-2" />
                <p className="text-sm text-gray-400">
                  Drag & drop files here, or{" "}
                  <label className="text-cyan-400 cursor-pointer hover:underline">
                    browse
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                      }}
                    />
                  </label>
                </p>
                <p className="text-xs text-gray-500 mt-1">PDF, DOCX, JPG, PNG, MP4, CSV — Max 500MB</p>

                {/* File Queue */}
                {files.length > 0 && (
                  <div className="mt-4 space-y-1.5 text-left">
                    {files.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-white/5 text-xs text-gray-300"
                      >
                        <span className="truncate">{f.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="text-red-400 hover:text-red-300 ml-2 shrink-0"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleSubmit(onSaveDraft)}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-all text-sm font-medium disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30 transition-all text-sm font-medium disabled:opacity-50"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Create Case
          </button>
        </div>
      </form>

      {/* Success Toast */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 glass-strong rounded-xl px-5 py-3 flex items-center gap-3 shadow-lg z-50"
        >
          <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
            <Send className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <p className="text-sm text-white font-medium">Case created successfully!</p>
            <p className="text-xs text-gray-400">Redirecting to cases list...</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
