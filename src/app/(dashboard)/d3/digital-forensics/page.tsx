"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Radio, Brain, Loader2, Smartphone, Laptop, HardDrive, Wifi, Shield, Search, ChevronRight, Lock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useData } from "@/lib/store";
import { askGemma } from "@/lib/gemma";

const deviceTypes = [
  { id: "smartphone", label: "Smartphone", icon: Smartphone, desc: "Mobile forensic extraction" },
  { id: "laptop", label: "Laptop / PC", icon: Laptop, desc: "Disk imaging & file carving" },
  { id: "storage", label: "External Storage", icon: HardDrive, desc: "USB, SSD, cloud backup" },
  { id: "network", label: "Network Traffic", icon: Wifi, desc: "Packet capture analysis" },
];

export default function DigitalForensicsPage() {
  const { cases, evidence } = useData();
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);

  const analyzeDevice = async (deviceId: string) => {
    setSelectedDevice(deviceId);
    setLoading(true);
    const device = deviceTypes.find(d => d.id === deviceId);

    const digitalEvidence = evidence.filter(e =>
      (e.tags || []).some(t => ["digital", "device", "phone", "laptop", "usb", "network", "cyber"].includes(t.toLowerCase()))
    );

    const prompt = `Perform a digital forensic analysis for a ${device?.label} device seizure:

Active cases: ${cases.map(c => `${c.id}: ${c.title}`).join(", ")}
Digital evidence in system: ${digitalEvidence.map(e => `${e.name} (${e.type})`).join(", ") || "No digital evidence uploaded yet"}
Device type: ${device?.label} — ${device?.desc}

Provide a comprehensive digital forensic report including:
- Recommended imaging procedure (write-blocker type, software)
- Expected data artifacts to recover
- Keyword search recommendations
- Encryption detection and bypass strategy
- Timeline reconstruction approach
- Network activity analysis (if applicable)
- Chain of custody digital requirements`;

    const result = await askGemma(prompt, "You are a certified digital forensics examiner AI. Provide detailed technical analysis for device examination procedures.");
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 font-['Space_Grotesk'] tracking-tight">Digital Forensics</h1>
        <p className="text-slate-500">Device imaging, encrypted data recovery, and network traffic analysis.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {deviceTypes.map((device) => (
          <motion.button
            key={device.id}
            whileHover={{ y: -4 }}
            onClick={() => analyzeDevice(device.id)}
            className={cn(
              "p-6 rounded-2xl border transition-all text-left group",
              selectedDevice === device.id
                ? "bg-violet-50 border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                : "bg-white border-white/5 hover:border-white/15"
            )}
          >
            <device.icon className={cn("w-8 h-8 mb-4", selectedDevice === device.id ? "text-violet-600" : "text-slate-400 group-hover:text-slate-500")} />
            <h3 className={cn("text-sm font-bold mb-1", selectedDevice === device.id ? "text-violet-600" : "text-slate-900")}>{device.label}</h3>
            <p className="text-[10px] text-slate-400">{device.desc}</p>
          </motion.button>
        ))}
      </div>

      <Card className="bg-white border-white/5">
        <CardHeader>
          <CardTitle className="text-lg text-slate-900 flex items-center gap-2 font-['Space_Grotesk']">
            <Brain className="w-5 h-5 text-violet-600" />
            Gemma AI Forensic Examination Plan
            {loading && <Loader2 className="w-4 h-4 animate-spin text-violet-600 ml-2" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
              <p className="text-sm text-slate-400">Generating forensic examination plan for {deviceTypes.find(d => d.id === selectedDevice)?.label}...</p>
            </div>
          ) : analysis ? (
            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{analysis}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Lock className="w-12 h-12 text-purple-500/20" />
              <p className="text-sm text-slate-400">Select a device type to generate examination plan</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-white/5">
          <CardContent className="p-6">
            <p className="text-xs text-slate-400 font-bold uppercase mb-1">Digital Evidence</p>
            <p className="text-2xl font-bold text-slate-900 font-mono">
              {evidence.filter(e => (e.tags || []).some(t => ["digital", "device", "phone", "laptop"].includes(t.toLowerCase()))).length}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Items in system</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-white/5">
          <CardContent className="p-6">
            <p className="text-xs text-slate-400 font-bold uppercase mb-1">Linked Cases</p>
            <p className="text-2xl font-bold text-slate-900 font-mono">{cases.length}</p>
            <p className="text-[10px] text-slate-400 mt-1">Active investigations</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-white/5">
          <CardContent className="p-6">
            <p className="text-xs text-slate-400 font-bold uppercase mb-1">AI Engine</p>
            <p className="text-2xl font-bold text-slate-900 font-mono">Gemma</p>
            <p className="text-[10px] text-green-600 mt-1">● Connected</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
