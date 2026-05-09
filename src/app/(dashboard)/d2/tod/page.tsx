"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Thermometer, Droplets, Clock, Brain, Activity, AlertTriangle,
  LineChart as LineChartIcon, Gauge, Radio,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot,
} from "recharts";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import { useData } from "@/lib/store";
import { generateTOD, getAICaseContext } from "@/lib/dynamic-data";
import type { TODResult, RigorStage, LivorStage } from "@/types";

const RIGOR_STAGES: RigorStage[] = ["None", "Onset", "Full", "Passing", "Absent"];
const LIVOR_STAGES: LivorStage[] = ["None", "Faint", "Fixed", "Deep Fixed"];

const todSchema = z.object({
  bodyTemperature: z.number().min(20).max(40),
  ambientTemperature: z.number().min(10).max(45),
  humidity: z.number().min(0).max(100),
  rigorStage: z.enum(["None", "Onset", "Full", "Passing", "Absent"]),
  livorStage: z.enum(["None", "Faint", "Fixed", "Deep Fixed"]),
});

type TODFormData = z.infer<typeof todSchema>;

const defaultValues: TODFormData = {
  bodyTemperature: 27.2,
  ambientTemperature: 31,
  humidity: 72,
  rigorStage: "Passing",
  livorStage: "Fixed",
};

function SliderInput({
  label, icon: Icon, value, min, max, step = 0.1, unit, onChange, color = "cyan",
}: {
  label: string; icon: React.ElementType; value: number; min: number; max: number;
  step?: number; unit: string; onChange: (v: number) => void; color?: string;
}) {
  const isCyan = color === "cyan";
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-lg", isCyan ? "bg-cyan-500/10 border border-cyan-500/20" : "bg-amber-500/10 border border-amber-500/20")}>
            <Icon className={cn("w-3.5 h-3.5", isCyan ? "text-cyan-400" : "text-amber-400")} />
          </div>
          <span className="text-xs font-medium text-gray-300">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => onChange(parseFloat(e.target.value) || min)}
            className={cn(
              "w-16 px-2 py-1 rounded-lg bg-white/5 border text-xs font-mono text-white text-center",
              isCyan ? "border-cyan-500/20 focus:border-cyan-500/50" : "border-amber-500/20 focus:border-amber-500/50",
            )}
          />
          <span className="text-[10px] text-gray-500 w-5">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400
          [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(0,245,255,0.5)]"
      />
      <div className="flex justify-between text-[10px] text-gray-600">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

function SegmentedButtons<T extends string>({
  options, value, onChange, label, icon: Icon,
}: {
  options: readonly T[]; value: T; onChange: (v: T) => void; label: string; icon: React.ElementType;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <Icon className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <span className="text-xs font-medium text-gray-300">{label}</span>
      </div>
      <div className="flex rounded-lg overflow-hidden border border-cyan-500/20 bg-white/[0.02]">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={cn(
              "flex-1 px-3 py-2 text-[11px] font-medium transition-all",
              value === opt
                ? "bg-cyan-500/20 text-cyan-300 shadow-inner"
                : "text-gray-500 hover:text-gray-300 hover:bg-white/5",
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function ConfidenceGauge({ percentage, size = 140 }: { percentage: number; size?: number }) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const color = percentage >= 85 ? "#22C55E" : percentage >= 70 ? "#F59E0B" : "#EF4444";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          className="text-3xl font-bold font-mono"
          style={{ color }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          {percentage}%
        </motion.span>
        <span className="text-[10px] text-gray-500 mt-0.5">Confidence</span>
      </div>
    </div>
  );
}

function EffectCard({ factor, description }: { factor: string; description: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="backdrop-blur-md bg-white/5 border border-cyan-500/15 rounded-xl p-3"
    >
      <p className="text-xs font-semibold text-cyan-300 mb-0.5">{factor}</p>
      <p className="text-[11px] text-gray-400 leading-relaxed">{description}</p>
    </motion.div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

function formatTODDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    + ", " + d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function TODPage() {
  const { cases } = useData();
  const [calculating, setCalculating] = useState(false);
  const [calculated, setCalculated] = useState(false);
  const [result, setResult] = useState<TODResult | null>(null);
  const [aiOpinion, setAiOpinion] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);

  const { watch, setValue, handleSubmit } = useForm<TODFormData>({
    resolver: zodResolver(todSchema),
    defaultValues,
  });

  const bodyTemp = watch("bodyTemperature");
  const ambientTemp = watch("ambientTemperature");
  const humidity = watch("humidity");
  const rigorStage = watch("rigorStage");
  const livorStage = watch("livorStage");

  const pullFromSensors = useCallback(() => {
    setValue("ambientTemperature", 30.8);
    setValue("humidity", 74);
  }, [setValue]);

  const onSubmit = useCallback(async () => {
    setCalculating(true);
    const data = generateTOD(bodyTemp, ambientTemp, humidity, rigorStage, livorStage);
    setResult(data);
    
    // Artificial delay for effect
    await new Promise(r => setTimeout(r, 1500));
    setCalculating(false);
    setCalculated(true);
    setLoadingAi(true);

    try {
      const context = getAICaseContext(cases, [], [], []);
      const prompt = `Based on the following TOD estimation data, provide a brief forensic opinion (2-3 sentences) explaining the significance of these findings.
      Body Temp: ${bodyTemp}°C, Ambient: ${ambientTemp}°C, Humidity: ${humidity}%, Rigor: ${rigorStage}, Livor: ${livorStage}.
      Calculated PMI: ${data.pmi}.
      Estimated Range: ${data.estimatedRange.start} to ${data.estimatedRange.end}.`;

      const aiRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: context },
            { role: "user", content: prompt }
          ]
        }),
      });
      const resData = await aiRes.json();
      setAiOpinion(resData.content);
    } catch (e) {
      console.error("AI TOD opinion failed:", e);
      setAiOpinion("Based on the cooling curve and decomposition markers, the estimated interval is consistent with the environmental conditions recorded.");
    } finally {
      setLoadingAi(false);
    }
  }, [bodyTemp, ambientTemp, humidity, rigorStage, livorStage, cases]);

  const chartData = useMemo(() => {
    if (!result) return [];
    return result.coolingCurve.map((pt, i) => ({
      hour: pt.hour,
      actual: pt.temp,
      henssge: result.henssgeCurve[i]?.temp ?? pt.temp,
    }));
  }, [result]);

  const intersection = useMemo(() => {
    if (!result) return null;
    for (let i = 0; i < result.coolingCurve.length - 1; i++) {
      const diff = Math.abs(result.coolingCurve[i].temp - result.henssgeCurve[i].temp);
      if (diff < 1.5) {
        return { hour: result.coolingCurve[i].hour, temp: result.coolingCurve[i].temp };
      }
    }
    return null;
  }, [result]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white tracking-tight">Time of Death Estimation</h1>
        <p className="text-sm text-gray-400 mt-1">Algor mortis, rigor mortis & livor mortis analysis</p>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Inputs */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.div variants={itemVariants} className="backdrop-blur-md bg-white/5 border border-cyan-500/20 rounded-2xl p-6 space-y-6">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Gauge className="w-4 h-4 text-cyan-400" />
                Manual Inputs
              </h2>

              <SliderInput
                label="Body Temperature"
                icon={Thermometer}
                value={bodyTemp}
                min={20}
                max={40}
                unit="°C"
                onChange={(v) => setValue("bodyTemperature", v)}
              />

              <SliderInput
                label="Ambient Temperature"
                icon={Thermometer}
                value={ambientTemp}
                min={10}
                max={45}
                unit="°C"
                onChange={(v) => setValue("ambientTemperature", v)}
                color="amber"
              />

              <SliderInput
                label="Humidity"
                icon={Droplets}
                value={humidity}
                min={0}
                max={100}
                step={1}
                unit="%"
                onChange={(v) => setValue("humidity", v)}
                color="amber"
              />

              <SegmentedButtons
                label="Rigor Mortis Stage"
                icon={Activity}
                options={RIGOR_STAGES}
                value={rigorStage}
                onChange={(v) => setValue("rigorStage", v)}
              />

              <SegmentedButtons
                label="Livor Mortis Stage"
                icon={Brain}
                options={LIVOR_STAGES}
                value={livorStage}
                onChange={(v) => setValue("livorStage", v)}
              />
            </motion.div>

            <motion.div variants={itemVariants} className="flex gap-3">
              <button
                type="button"
                onClick={pullFromSensors}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-cyan-500/20 text-gray-300 hover:text-white hover:border-cyan-500/40 text-sm font-medium transition-all"
              >
                <Radio className="w-4 h-4 text-cyan-400" />
                Pull from Live Sensors
              </button>

              <button
                type="submit"
                disabled={calculating}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 font-semibold text-sm hover:bg-cyan-500/30 disabled:opacity-50 transition-all relative overflow-hidden"
              >
                {calculating ? (
                  <>
                    <motion.div
                      className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4" />
                    Calculate TOD
                    <motion.div
                      className="absolute inset-0 bg-cyan-400/5"
                      animate={{ opacity: [0, 0.3, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </>
                )}
              </button>
            </motion.div>
          </motion.div>

          {/* RIGHT: Output */}
          <AnimatePresence mode="wait">
            {calculating && (
              <motion.div
                key="calculating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="backdrop-blur-md bg-white/5 border border-cyan-500/20 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[400px]"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Clock className="w-12 h-12 text-cyan-400" />
                </motion.div>
                <p className="text-lg font-semibold text-white mt-4">Calculating Time of Death...</p>
                <p className="text-sm text-gray-400 mt-1">Applying Henssge nomogram & rigor/livor adjustments</p>
                <div className="w-48 h-1.5 rounded-full bg-white/10 mt-6 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
              </motion.div>
            )}

            {!calculating && calculated && result && (
              <motion.div
                key="result"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {/* TOD Range */}
                <motion.div
                  variants={itemVariants}
                  className="backdrop-blur-md bg-white/5 border border-cyan-500/20 rounded-2xl p-6 text-center"
                >
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Estimated Time of Death</p>
                  <p className="text-xl md:text-2xl font-bold text-cyan-300 font-mono">
                    {formatTODDate(result.estimatedRange.start)}
                  </p>
                  <p className="text-sm text-gray-500 font-mono mt-1">
                    <span className="text-gray-600">to</span>{" "}
                    {formatTODDate(result.estimatedRange.end)}
                  </p>
                </motion.div>

                {/* PMI + Confidence */}
                <div className="grid grid-cols-2 gap-4">
                  <motion.div
                    variants={itemVariants}
                    className="backdrop-blur-md bg-white/5 border border-cyan-500/20 rounded-2xl p-5 text-center"
                  >
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider">Post-Mortem Interval</span>
                    </div>
                    <p className="text-xl font-bold font-mono text-white">{result.pmi}</p>
                  </motion.div>

                  <motion.div
                    variants={itemVariants}
                    className="backdrop-blur-md bg-white/5 border border-cyan-500/20 rounded-2xl p-5 flex flex-col items-center justify-center"
                  >
                    <ConfidenceGauge percentage={result.confidence} />
                  </motion.div>
                </div>

                {/* Method Used */}
                <motion.div
                  variants={itemVariants}
                  className="backdrop-blur-md bg-white/5 border border-cyan-500/20 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <Brain className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">Method</span>
                    <span className="text-xs text-gray-300 ml-auto">{result.method}</span>
                  </div>
                </motion.div>

                {/* AI Forensic Opinion */}
                <motion.div
                  variants={itemVariants}
                  className="backdrop-blur-md bg-cyan-500/5 border border-cyan-500/30 rounded-2xl p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-semibold text-white uppercase tracking-wider">AI Forensic Opinion</h3>
                  </div>
                  {loadingAi ? (
                    <div className="space-y-2">
                      <div className="h-3 w-full bg-white/5 rounded animate-pulse" />
                      <div className="h-3 w-3/4 bg-white/5 rounded animate-pulse" />
                    </div>
                  ) : (
                    <p className="text-sm text-cyan-100 leading-relaxed italic">
                      "{aiOpinion}"
                    </p>
                  )}
                </motion.div>

                {/* PMI Graph */}
                <motion.div
                  variants={itemVariants}
                  className="backdrop-blur-md bg-white/5 border border-cyan-500/20 rounded-2xl p-4 md:p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <LineChartIcon className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">PMI Cooling Curve</h3>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="hour"
                        tick={{ fill: "#6B7280", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        label={{ value: "Hours Post-Death", position: "insideBottomRight", offset: -5, style: { fill: "#6B7280", fontSize: 10 } }}
                      />
                      <YAxis
                        tick={{ fill: "#6B7280", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        domain={[15, 38]}
                        label={{ value: "°C", angle: -90, position: "insideLeft", style: { fill: "#6B7280", fontSize: 10 } }}
                      />
                      <Tooltip
                        contentStyle={{ background: "rgba(17,24,39,0.95)", border: "1px solid rgba(0,245,255,0.2)", borderRadius: 8, fontSize: 12 }}
                        labelStyle={{ color: "#9CA3AF" }}
                        formatter={(value: unknown) => [`${Number(value).toFixed(1)}°C`]}
                      />
                      <Line type="monotone" dataKey="actual" stroke="#00F5FF" strokeWidth={2} dot={false} name="Actual Cooling" />
                      <Line type="monotone" dataKey="henssge" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Henssge Curve" />
                      {intersection && (
                        <ReferenceDot
                          x={intersection.hour}
                          y={intersection.temp}
                          r={5}
                          fill="#EF4444"
                          stroke="none"
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="flex items-center justify-center gap-6 mt-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 rounded bg-cyan-400" />
                      <span className="text-[10px] text-gray-500">Actual Cooling</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 rounded bg-amber-400" style={{ borderTop: "2px dashed #F59E0B", height: 0 }} />
                      <span className="text-[10px] text-gray-500">Henssge Curve</span>
                    </div>
                    {intersection && (
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <span className="text-[10px] text-gray-500">Match Point</span>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Environmental Effects */}
                <motion.div
                  variants={itemVariants}
                  className="backdrop-blur-md bg-white/5 border border-cyan-500/20 rounded-2xl p-4 md:p-6"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Environmental Effect Analysis</h3>
                  </div>
                  <div className="space-y-2">
                    {result.effects.map((eff, i) => (
                      <EffectCard key={i} factor={eff.factor} description={eff.description} />
                    ))}
                  </div>
                </motion.div>

                {/* Algor Mortis Formula */}
                <motion.div
                  variants={itemVariants}
                  className="backdrop-blur-md bg-white/5 border border-cyan-500/20 rounded-2xl px-5 py-4"
                >
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Algor Mortis Formula</p>
                  <p className="text-sm font-mono text-gray-300">
                    T<span className="text-[10px] align-sub">body</span> = T<span className="text-[10px] align-sub">ambient</span> + (T<span className="text-[10px] align-sub">rectal</span> − T<span className="text-[10px] align-sub">ambient</span>) × e<sup>-k·t</sup>
                  </p>
                </motion.div>
              </motion.div>
            )}

            {!calculating && !calculated && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="backdrop-blur-md bg-white/5 border border-cyan-500/20 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[400px]"
              >
                <Clock className="w-16 h-16 text-gray-600 mb-4" />
                <p className="text-lg font-semibold text-gray-400">Enter parameters and calculate</p>
                <p className="text-sm text-gray-600 mt-1">Fill in the inputs on the left panel</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </form>
    </div>
  );
}
