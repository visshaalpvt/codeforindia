"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Brain, Loader2, AlertTriangle, Activity, Thermometer, Droplets } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useData } from "@/lib/store";
import { askGemma } from "@/lib/gemma";

const decompStages = [
  { id: 1, name: "Fresh", range: "0-2 days", desc: "No visible decomposition. Autolysis begins internally.", color: "text-green-400", bg: "bg-green-500/10" },
  { id: 2, name: "Bloat", range: "2-6 days", desc: "Gas buildup, skin discoloration, body swelling begins.", color: "text-yellow-400", bg: "bg-yellow-500/10" },
  { id: 3, name: "Active Decay", range: "6-10 days", desc: "Mass loss through purging fluids and insect activity.", color: "text-amber-400", bg: "bg-amber-500/10" },
  { id: 4, name: "Advanced Decay", range: "10-25 days", desc: "Majority of soft tissue consumed. Slow drying.", color: "text-orange-400", bg: "bg-orange-500/10" },
  { id: 5, name: "Skeletonization", range: "25+ days", desc: "Only skeletal remains, cartilage, and dried skin remain.", color: "text-red-400", bg: "bg-red-500/10" },
];

export default function DecompTrackerPage() {
  const { cases, sensors } = useData();
  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState("");

  const tempSensor = sensors.find(s => s.name === "Temperature Sensor");
  const humiditySensor = sensors.find(s => s.name === "Humidity Sensor");
  const currentTemp = tempSensor?.readings?.[tempSensor.readings.length - 1]?.value || 28;
  const currentHumidity = humiditySensor?.readings?.[humiditySensor.readings.length - 1]?.value || 65;

  const analyzeDecomp = async (stageId: number) => {
    setSelectedStage(stageId);
    setLoading(true);
    const stage = decompStages.find(s => s.id === stageId)!;
    const caseData = cases.find(c => c.id === selectedCase);

    const prompt = `Analyze decomposition for forensic PMI estimation:

Decomposition stage observed: ${stage.name} (${stage.range})
Stage description: ${stage.desc}
Case: ${caseData ? `${caseData.id}: ${caseData.title}` : "No case selected"}
Environmental conditions:
- Temperature: ${currentTemp}°C
- Humidity: ${currentHumidity}%

Provide forensic decomposition analysis:
- Estimated PMI range for this stage at ${currentTemp}°C
- Biochemical markers expected (putrescine, cadaverine, ATP levels)
- pH changes in surrounding soil/fluid
- Temperature correction using ADD (Accumulated Degree Days)
- Impact of humidity on decomposition rate
- Whether body was exposed or sheltered
- Insect colonization correlation
- Recommendations for evidence preservation at this stage`;

    const result = await askGemma(prompt, "You are a forensic taphonomist AI. Provide decomposition analysis with precise ADD calculations and biochemical marker assessments.");
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-['Space_Grotesk'] tracking-tight">Decomp Tracker</h1>
          <p className="text-gray-400">5-stage decomposition tracking with biochemical marker analysis.</p>
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

      {/* Environment Readings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-[#111827] border-white/5">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase mb-1">Scene Temperature</p>
              <p className="text-3xl font-bold text-white font-mono">{currentTemp.toFixed(1)}°C</p>
              <p className="text-[10px] text-gray-600 mt-1">From IoT sensor feed</p>
            </div>
            <Thermometer className="w-10 h-10 opacity-20 text-amber-400" />
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-white/5">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase mb-1">Relative Humidity</p>
              <p className="text-3xl font-bold text-white font-mono">{currentHumidity.toFixed(0)}%</p>
              <p className="text-[10px] text-gray-600 mt-1">From IoT sensor feed</p>
            </div>
            <Droplets className="w-10 h-10 opacity-20 text-blue-400" />
          </CardContent>
        </Card>
      </div>

      {/* Stage Selector */}
      <Card className="bg-[#111827] border-white/5">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2 font-['Space_Grotesk']">
            <Clock className="w-5 h-5 text-amber-400" />
            Decomposition Stages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {decompStages.map((stage) => (
              <motion.button
                key={stage.id}
                whileHover={{ y: -4 }}
                onClick={() => analyzeDecomp(stage.id)}
                className={cn(
                  "p-4 rounded-2xl border transition-all text-left",
                  selectedStage === stage.id
                    ? cn(stage.bg, "border-amber-500/30 shadow-lg")
                    : "bg-white/[0.02] border-white/5 hover:border-white/15"
                )}
              >
                <div className={cn("text-2xl font-bold font-mono mb-2", selectedStage === stage.id ? stage.color : "text-gray-600")}>{stage.id}</div>
                <p className={cn("text-sm font-bold mb-1", selectedStage === stage.id ? "text-white" : "text-gray-400")}>{stage.name}</p>
                <p className="text-[10px] text-gray-600">{stage.range}</p>
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis */}
      <Card className="bg-[#111827] border-white/5">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2 font-['Space_Grotesk']">
            <Brain className="w-5 h-5 text-amber-400" />
            Gemma AI Decomposition Assessment
            {loading && <Loader2 className="w-4 h-4 animate-spin text-amber-400 ml-2" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              <p className="text-sm text-gray-500">Analyzing {decompStages.find(s => s.id === selectedStage)?.name} stage...</p>
            </div>
          ) : analysis ? (
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Activity className="w-3 h-3 text-amber-400" />
                <span className="text-xs font-bold text-amber-400">
                  Stage {selectedStage}: {decompStages.find(s => s.id === selectedStage)?.name}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{analysis}</p>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-gray-600">
                <AlertTriangle className="w-3 h-3" />
                <span>AI analysis — requires certified forensic pathologist review.</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Clock className="w-12 h-12 text-amber-500/20" />
              <p className="text-sm text-gray-600">Select a decomposition stage to analyze</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
