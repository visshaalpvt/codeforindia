"use client";

import React from "react";
import { motion } from "framer-motion";
import { Microscope, Activity, Clock, FlaskConical, ShieldCheck, Brain, Bug, Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useData } from "@/lib/store";
import Link from "next/link";

export default function LabOverviewPage() {
  const { cases, evidence, sensors } = useData();

  const labModules = [
    { href: "/d2/autopsy", title: "Autopsy Analysis", desc: "AI forensic report extraction", icon: Microscope, count: cases.length, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-500/20" },
    { href: "/d2/tod", title: "TOD Estimation", desc: "Time of death calculation", icon: Clock, count: cases.length, color: "text-blue-600", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { href: "/d2/toxicology", title: "Toxicology Panel", desc: "Substance detection & analysis", icon: FlaskConical, count: evidence.filter(e => e.tags.some(t => t.toLowerCase().includes("tox"))).length, color: "text-green-600", bg: "bg-green-500/10", border: "border-green-500/20" },
    { href: "/d2/wounds", title: "Wound Analysis", desc: "Body map force diagnostics", icon: Activity, count: 0, color: "text-red-600", bg: "bg-red-500/10", border: "border-red-500/20" },
    { href: "/d2/image-ai", title: "Evidence Image AI", desc: "Object detection & OCR", icon: Brain, count: evidence.filter(e => e.type === "Image").length, color: "text-violet-600", bg: "bg-violet-50", border: "border-slate-200" },
    { href: "/d2/fingerprints", title: "Fingerprint Vault", desc: "AFIS ridge pattern matching", icon: ShieldCheck, count: evidence.filter(e => e.tags.some(t => t.toLowerCase().includes("fingerprint"))).length, color: "text-violet-600", bg: "bg-violet-50", border: "border-slate-200" },
    { href: "/d2/dna", title: "DNA & Bio Data", desc: "STR profiling & CODIS", icon: Activity, count: evidence.filter(e => e.tags.some(t => t.toLowerCase().includes("dna"))).length, color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20" },
    { href: "/d2/entomology", title: "Entomology Log", desc: "PMI insect development", icon: Bug, count: 0, color: "text-lime-400", bg: "bg-lime-500/10", border: "border-lime-500/20" },
    { href: "/d2/decomp", title: "Decomp Tracker", desc: "5-stage decomposition tracking", icon: Clock, count: 0, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
    { href: "/d2/lab-samples", title: "Lab Sample Pipeline", desc: "Sample processing tracker", icon: Database, count: 0, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
  ];

  const tempSensor = sensors.find(s => s.name === "Temperature Sensor");
  const humiditySensor = sensors.find(s => s.name === "Humidity Sensor");

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 font-['Space_Grotesk'] tracking-tight">Forensic Lab Overview</h1>
        <p className="text-slate-500">Central hub for all forensic science laboratory modules.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-white/5">
          <CardContent className="p-6">
            <p className="text-xs text-slate-400 uppercase font-bold mb-1">Active Cases</p>
            <p className="text-3xl font-bold text-slate-900 font-mono">{cases.filter(c => c.status === "Active").length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-white/5">
          <CardContent className="p-6">
            <p className="text-xs text-slate-400 uppercase font-bold mb-1">Evidence Items</p>
            <p className="text-3xl font-bold text-slate-900 font-mono">{evidence.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-white/5">
          <CardContent className="p-6">
            <p className="text-xs text-slate-400 uppercase font-bold mb-1">Lab Temp</p>
            <p className="text-3xl font-bold text-slate-900 font-mono">{tempSensor ? Number(tempSensor.value).toFixed(1) : "—"}°C</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-white/5">
          <CardContent className="p-6">
            <p className="text-xs text-slate-400 uppercase font-bold mb-1">Humidity</p>
            <p className="text-3xl font-bold text-slate-900 font-mono">{humiditySensor ? Number(humiditySensor.value).toFixed(0) : "—"}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {labModules.map((mod, i) => (
          <Link key={mod.href} href={mod.href}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className={cn("p-6 rounded-2xl bg-white border border-white/5 hover:border-amber-500/30 transition-all cursor-pointer group")}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-3 rounded-xl", mod.bg)}>
                  <mod.icon className={cn("w-6 h-6", mod.color)} />
                </div>
                {mod.count > 0 && (
                  <span className="text-xs font-mono font-bold text-slate-400 bg-slate-50 hover:bg-slate-100 px-2 py-0.5 rounded">{mod.count}</span>
                )}
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1 group-hover:text-amber-600 transition-colors font-['Space_Grotesk']">{mod.title}</h3>
              <p className="text-xs text-slate-400">{mod.desc}</p>
            </motion.div>
          </Link>
        ))}
      </div>

      <Card className="bg-white border-white/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5 text-amber-600" />
            <p className="text-sm font-bold text-slate-900 font-['Space_Grotesk']">AI Engine Status</p>
          </div>
          <p className="text-xs text-slate-500">Gemma Neural Engine is <span className="text-green-600 font-bold">● Online</span> — powering forensic analysis across all lab modules.</p>
        </CardContent>
      </Card>
    </div>
  );
}
