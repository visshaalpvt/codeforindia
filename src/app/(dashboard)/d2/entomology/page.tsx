"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Bug, Brain, Loader2, Clock, Plus, AlertTriangle, Thermometer } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useData } from "@/lib/store";
import { askGemma } from "@/lib/gemma";

const insectStages = [
  { name: "Egg", duration: "0-24h", color: "text-blue-400" },
  { name: "1st Instar Larva", duration: "1-2 days", color: "text-cyan-400" },
  { name: "2nd Instar Larva", duration: "2-4 days", color: "text-green-400" },
  { name: "3rd Instar Larva", duration: "4-8 days", color: "text-amber-400" },
  { name: "Pre-pupa", duration: "8-12 days", color: "text-orange-400" },
  { name: "Pupa", duration: "12-20 days", color: "text-red-400" },
  { name: "Adult", duration: "20+ days", color: "text-purple-400" },
];

export default function EntomologyPage() {
  const { cases, sensors } = useData();
  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState("");

  const tempSensor = sensors.find(s => s.type === "Temperature");
  const humiditySensor = sensors.find(s => s.type === "Humidity");

  const analyzeStage = async (stageIndex: number) => {
    setSelectedStage(stageIndex);
    setLoading(true);
    const stage = insectStages[stageIndex];
    const caseData = cases.find(c => c.id === selectedCase);

    const prompt = `Perform forensic entomological analysis for PMI (Post-Mortem Interval) estimation:

Selected insect development stage: ${stage.name} (${stage.duration})
Case: ${caseData ? `${caseData.id}: ${caseData.title}` : "No case selected"}
Ambient temperature: ${tempSensor?.readings?.[tempSensor.readings.length - 1]?.value || 28}°C
Humidity: ${humiditySensor?.readings?.[humiditySensor.readings.length - 1]?.value || 65}%

Provide forensic entomology analysis:
- Estimated PMI range based on this developmental stage
- ADH (Accumulated Degree Hours) calculation
- Species identification (Calliphoridae, Sarcophagidae, etc.)
- Temperature correction factors applied
- Confidence level of PMI estimation
- Seasonal and geographic considerations
- Recommendation for additional specimen collection`;

    const result = await askGemma(prompt, "You are a forensic entomologist AI. Provide PMI estimations using insect development data.");
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-['Space_Grotesk'] tracking-tight">Entomology Log</h1>
          <p className="text-gray-400">Insect development stage analysis for PMI estimation.</p>
        </div>
        <select
          value={selectedCase}
          onChange={(e) => setSelectedCase(e.target.value)}
          className="px-4 py-2 rounded-xl bg-white/5 border border-amber-500/20 text-white text-sm focus:outline-none"
        >
          <option value="">Select case...</option>
          {cases.map(c => <option key={c.id} value={c.id}>{c.id} — {c.title}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#111827] border-white/5">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase mb-1">Ambient Temp</p>
              <p className="text-2xl font-bold text-white font-mono">{tempSensor?.readings?.[tempSensor.readings.length - 1]?.value?.toFixed(1) || "28.0"}°C</p>
            </div>
            <Thermometer className="w-8 h-8 opacity-20 text-amber-400" />
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-white/5">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase mb-1">Humidity</p>
              <p className="text-2xl font-bold text-white font-mono">{humiditySensor?.readings?.[humiditySensor.readings.length - 1]?.value?.toFixed(0) || "65"}%</p>
            </div>
            <Bug className="w-8 h-8 opacity-20 text-green-400" />
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-white/5">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase mb-1">AI Engine</p>
              <p className="text-2xl font-bold text-white font-mono">Gemma</p>
            </div>
            <Brain className="w-8 h-8 opacity-20 text-purple-400" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-[#111827] border-white/5">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2 font-['Space_Grotesk']">
              <Bug className="w-5 h-5 text-amber-400" />
              Development Stage Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insectStages.map((stage, i) => (
              <button
                key={i}
                onClick={() => analyzeStage(i)}
                className={cn(
                  "w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between",
                  selectedStage === i
                    ? "bg-amber-500/10 border-amber-500/30"
                    : "bg-white/[0.02] border-white/5 hover:border-white/15"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("w-3 h-3 rounded-full", selectedStage === i ? "bg-amber-400" : "bg-gray-700")} />
                  <div>
                    <p className={cn("text-sm font-bold", selectedStage === i ? "text-amber-400" : "text-white")}>{stage.name}</p>
                    <p className="text-[10px] text-gray-600">{stage.duration}</p>
                  </div>
                </div>
                <Clock className={cn("w-4 h-4", stage.color)} />
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-[#111827] border-white/5">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2 font-['Space_Grotesk']">
              <Brain className="w-5 h-5 text-amber-400" />
              Gemma AI PMI Estimation
              {loading && <Loader2 className="w-4 h-4 animate-spin text-amber-400 ml-2" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                <p className="text-sm text-gray-500">Calculating PMI from {insectStages[selectedStage!]?.name} stage...</p>
              </div>
            ) : analysis ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{analysis}</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-600">
                  <AlertTriangle className="w-3 h-3" />
                  <span>AI estimation — requires board-certified forensic entomologist verification.</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Bug className="w-12 h-12 text-amber-500/20" />
                <p className="text-sm text-gray-600">Select a development stage to estimate PMI</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
