"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Thermometer, Droplets, Wind, Activity, Video, MapPin,
  Radio, Cpu, Wifi, Zap, AlertTriangle, RefreshCw, Camera, CheckCircle, ShieldCheck
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { cn, formatTime, timeAgo, formatDate } from "@/lib/utils";
import { generateMockSensorReading } from "@/lib/mock-data";
import { useData } from "@/lib/store";
import { getSocket } from "@/lib/socket";
import type { SensorDevice, SensorReading, TimelineEvent } from "@/types";

const sensorIcons: Record<string, React.ElementType> = {
  DHT22: Thermometer,
  "MQ-135": Wind,
  Camera: Video,
  GPS: MapPin,
};
const sensorColors: Record<string, string> = {
  "Temperature Sensor": "#00F5FF",
  "Humidity Sensor": "#3B82F6",
  "Air Quality Monitor": "#F59E0B",
  "Live Camera Feed": "#8B5CF6",
  "GPS Tracker": "#10B981",
};
const sensorUnits: Record<string, string> = {
  "Temperature Sensor": "°C",
  "Humidity Sensor": "%",
  "Air Quality Monitor": "AQI",
  "Live Camera Feed": "",
  "GPS Tracker": "",
};

function SensorSparkline({ data, color }: { data: { value: number; timestamp: string }[]; color: string }) {
  const chartData = data.map((d) => ({ v: d.value }));
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={chartData}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Online: "bg-green-100 text-green-600 border-green-500/30",
    Offline: "bg-red-100 text-red-600 border-red-500/30",
    Alert: "bg-red-100 text-red-600 border-red-500/30 animate-pulse",
    Threshold: "bg-amber-100 text-amber-600 border-amber-500/30",
  };
  const dotColors: Record<string, string> = {
    Online: "bg-green-500",
    Offline: "bg-red-500",
    Alert: "bg-red-500",
    Threshold: "bg-amber-500",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border", colors[status] || "bg-gray-500/20 text-slate-500 border-gray-500/30")}>
      <span className={cn("w-1.5 h-1.5 rounded-full", dotColors[status] || "bg-gray-500")} />
      {status}
    </span>
  );
}

function SensorCard({ sensor, time }: { sensor: SensorDevice; time: number }) {
  const icon = sensorIcons[sensor.type] || Radio;
  const color = sensorColors[sensor.name] || "#00F5FF";
  const Icon = icon;
  const isAlert = sensor.status === "Alert";
  const isCamera = sensor.type === "Camera";
  const { innerWidth: winW } = typeof window !== "undefined" ? window : { innerWidth: 1200 };
  const isCompact = winW < 640;

  const displayValue = useMemo(() => {
    if (sensor.type === "GPS") return String(sensor.value);
    if (typeof sensor.value === "number") return sensor.value.toFixed(1);
    return String(sensor.value);
  }, [sensor]);

  const thresholdPercent = useMemo(() => {
    if (sensor.name === "Temperature Sensor") return Math.min(((sensor.value as number) / 50) * 100, 100);
    if (sensor.name === "Humidity Sensor") return Math.min(((sensor.value as number) / 100) * 100, 100);
    if (sensor.name === "Air Quality Monitor") return Math.min(((sensor.value as number) / 500) * 100, 100);
    return 50;
  }, [sensor]);

  const thresholdColor = thresholdPercent > 80 ? "bg-red-500" : thresholdPercent > 60 ? "bg-amber-500" : "bg-green-500";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      transition={{ duration: 0.3 }}
      className={cn(
        "backdrop-blur-md bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl p-4 transition-colors",
      )}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-900">{sensor.name}</p>
            <p className="text-[10px] text-slate-400 font-mono">{sensor.type}</p>
          </div>
        </div>
        <StatusBadge status={sensor.status} />
      </div>

      {/* Data Visualization */}
      {isCamera ? (
        <div className="relative mt-2 rounded-xl overflow-hidden border border-white/10 aspect-video bg-black">
          <img 
            src="/live_security_camera_feed_placeholder_1778365536252.png" 
            alt="Live Feed" 
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-bold text-white tracking-widest uppercase">REC • CAM-01</span>
          </div>
          <div className="absolute bottom-3 right-3 text-[10px] font-mono text-white/60">
            {new Date().toISOString().slice(0, 19).replace("T", " ")}
          </div>
          <div className="absolute inset-0 border-[20px] border-transparent group-hover:border-white/5 transition-all pointer-events-none" />
        </div>
      ) : (
        <>
          <p className="font-mono font-bold text-3xl md:text-4xl tracking-tight mb-1" style={{ color }}>
            {displayValue}
            {sensorUnits[sensor.name] && (
              <span className="text-lg text-slate-400 ml-1">{sensorUnits[sensor.name]}</span>
            )}
          </p>

          <div className="my-3">
            <SensorSparkline data={sensor.history} color={color} />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Threshold</span>
              <span className="font-mono">{Math.round(thresholdPercent)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${thresholdPercent}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={cn("h-full rounded-full", thresholdColor)}
              />
            </div>
          </div>
        </>
      )}

      {/* Last Updated */}
      <p className="text-[10px] text-slate-400 mt-3 font-mono">
        Updated {timeAgo(sensor.lastUpdated)}
      </p>
    </motion.div>
  );
}

function ConnectionPanel({ 
  onConnect, 
  status, 
  espIp, 
  setEspIp, 
  camIp, 
  setCamIp 
}: { 
  onConnect: () => void; 
  status: "disconnected" | "connecting" | "connected";
  espIp: string;
  setEspIp: (v: string) => void;
  camIp: string;
  setCamIp: (v: string) => void;
}) {
  return (
    <div className="backdrop-blur-md bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl p-4 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <Wifi className={cn("w-4 h-4", status === "connected" ? "text-green-500" : "text-slate-400")} />
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-widest">ESP32 Device Gateway</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 uppercase tracking-wider">
            <Cpu className="w-3 h-3" /> ESP32 Controller IP
          </label>
          <input 
            type="text" 
            value={espIp}
            onChange={(e) => setEspIp(e.target.value)}
            placeholder="192.168.1.10"
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 uppercase tracking-wider">
            <Camera className="w-3 h-3" /> ESP32-CAM Stream IP
          </label>
          <input 
            type="text" 
            value={camIp}
            onChange={(e) => setCamIp(e.target.value)}
            placeholder="192.168.1.20"
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
          />
        </div>

        <button 
          onClick={onConnect}
          disabled={status === "connecting"}
          className={cn(
            "w-full py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2",
            status === "connected" 
              ? "bg-green-50 text-green-600 border border-green-200 hover:bg-green-100" 
              : "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 hover:bg-cyan-600 active:scale-95 disabled:opacity-50"
          )}
        >
          {status === "connecting" ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Initializing...
            </>
          ) : status === "connected" ? (
            <>
              <CheckCircle className="w-3.5 h-3.5" />
              Devices Linked
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5" />
              Connect Devices
            </>
          )}
        </button>

        {status === "connected" && (
          <div className="flex items-center gap-4 px-2 py-1 bg-green-50/50 rounded-lg border border-green-100">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[9px] font-bold text-green-700 uppercase">ESP32: UP</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[9px] font-bold text-green-700 uppercase">CAM: LIVE</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LiveSurveillanceFeed({ 
  status, 
  onCapture,
  motionDetected
}: { 
  status: "disconnected" | "connecting" | "connected";
  onCapture: () => void;
  motionDetected: boolean;
}) {
  return (
    <div className="backdrop-blur-md bg-slate-50 border border-slate-200 rounded-2xl p-4 md:p-6 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex h-3 w-3">
            <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping", status === "connected" ? "bg-red-400" : "bg-slate-400")} />
            <span className={cn("relative inline-flex h-3 w-3 rounded-full", status === "connected" ? "bg-red-500" : "bg-slate-500")} />
          </div>
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-widest">🎥 Live Surveillance Feed</h2>
        </div>
        <div className="flex items-center gap-2">
          {motionDetected && (
            <span className="px-2 py-0.5 rounded bg-red-100 text-red-600 text-[10px] font-bold border border-red-200 animate-pulse uppercase tracking-wider">
              Motion Alert
            </span>
          )}
          <span className={cn(
            "px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider",
            status === "connected" ? "bg-cyan-50 text-cyan-600 border-cyan-200" : "bg-slate-100 text-slate-400 border-slate-200"
          )}>
            {status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className={cn(
        "relative rounded-2xl overflow-hidden border transition-all aspect-video group",
        motionDetected ? "border-red-500/50 shadow-lg shadow-red-500/10" : "border-slate-200 shadow-xl",
        status === "connected" ? "bg-black" : "bg-slate-100 flex items-center justify-center"
      )}>
        {status === "connected" ? (
          <>
            <img 
              src="/live_security_camera_feed_placeholder_1778365536252.png" 
              alt="ESP32-CAM Stream" 
              className={cn("w-full h-full object-cover transition-opacity", motionDetected ? "opacity-100" : "opacity-80")}
            />
            {/* Surveillance Overlays */}
            <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-white tracking-widest uppercase">REC • ESP32-CAM-01</span>
                </div>
                <div className="text-[10px] font-mono text-white/80 bg-black/40 px-2 py-1 rounded backdrop-blur-sm">
                  1080P | 30FPS | CH-01
                </div>
              </div>
              
              <div className="flex justify-between items-end">
                <div className="text-[10px] font-mono text-white/60 bg-black/40 px-2 py-1 rounded backdrop-blur-sm">
                  ZONE: EVIDENCE_STORAGE_A
                </div>
                <div className="text-[10px] font-mono text-white/60 bg-black/40 px-2 py-1 rounded backdrop-blur-sm">
                  {new Date().toISOString().slice(0, 19).replace("T", " ")}
                </div>
              </div>
            </div>

            {/* Viewfinder corners */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-white/40" />
            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-white/40" />
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-white/40" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-white/40" />

            {/* Motion Glow */}
            <AnimatePresence>
              {motionDetected && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 border-4 border-red-500/30 animate-pulse pointer-events-none"
                />
              )}
            </AnimatePresence>

            {/* Overlay Actions */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-[2px]">
              <button 
                onClick={onCapture}
                className="p-3 rounded-full bg-white text-slate-900 hover:scale-110 active:scale-95 transition-all shadow-xl"
                title="Capture Snapshot"
              >
                <Camera className="w-5 h-5" />
              </button>
              <button 
                className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all backdrop-blur-md border border-white/20"
                title="Toggle Fullscreen"
              >
                <Activity className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          <div className="text-center space-y-3">
            <div className="p-4 rounded-full bg-white/50 inline-block border border-slate-200">
              <Camera className="w-8 h-8 text-slate-300" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Waiting for stream...</p>
              <p className="text-[10px] text-slate-400 font-medium">Initialize connection to view feed</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Stream Quality", value: "High (4K)", icon: Wifi },
          { label: "Evidence Zone", value: "Active", icon: ShieldCheck },
          { label: "IP Address", value: "192.168.1.20", icon: Radio },
          { label: "Motion Detection", value: motionDetected ? "ALERT" : "CLEAR", icon: Activity, alert: motionDetected },
        ].map((item, i) => (
          <div key={i} className={cn(
            "p-2.5 rounded-xl border flex flex-col gap-1 transition-all",
            item.alert ? "bg-red-50 border-red-200" : "bg-white border-slate-100"
          )}>
            <div className="flex items-center gap-1.5 text-[9px] text-slate-400 uppercase font-bold tracking-wider">
              <item.icon className={cn("w-3 h-3", item.alert ? "text-red-500" : "text-slate-400")} />
              {item.label}
            </div>
            <p className={cn("text-xs font-bold", item.alert ? "text-red-600" : "text-slate-700")}>{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveDataChart({ sensors, time }: { sensors: SensorDevice[]; time: number }) {
  const chartData = useMemo(() => {
    const temp = sensors.find((s) => s.name === "Temperature Sensor");
    const hum = sensors.find((s) => s.name === "Humidity Sensor");
    const aqi = sensors.find((s) => s.name === "Air Quality Monitor");
    const maxLen = Math.max(
      temp?.history.length || 0,
      hum?.history.length || 0,
      aqi?.history.length || 0,
    );
    return Array.from({ length: maxLen }, (_, i) => ({
      t: i,
      temp: temp?.history[i]?.value,
      hum: hum?.history[i]?.value,
      aqi: aqi?.history[i]?.value,
    }));
  }, [sensors, time]);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="t" tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: "rgba(17,24,39,0.95)", border: "1px solid rgba(0,245,255,0.2)", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "#9CA3AF" }}
        />
        <Line type="monotone" dataKey="temp" stroke="#00F5FF" strokeWidth={2} dot={false} isAnimationActive={false} name="Temp °C" />
        <Line type="monotone" dataKey="hum" stroke="#3B82F6" strokeWidth={2} dot={false} isAnimationActive={false} name="Humidity %" />
        <Line type="monotone" dataKey="aqi" stroke="#F59E0B" strokeWidth={2} dot={false} isAnimationActive={false} name="AQI" />
      </LineChart>
    </ResponsiveContainer>
  );
}

function HardwareStatusPanel({ lastReading, onSimulate }: { lastReading: SensorReading | null; onSimulate: () => void }) {
  const [heartbeatTime, setHeartbeatTime] = useState(Date.now());

  useEffect(() => {
    const iv = setInterval(() => setHeartbeatTime(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  const jsonPayload = lastReading
    ? JSON.stringify(lastReading, null, 2)
    : JSON.stringify({ status: "awaiting data", timestamp: new Date().toISOString() }, null, 2);

  return (
    <div className="backdrop-blur-md bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Hardware Status</h2>
        <Cpu className="w-4 h-4 text-violet-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ESP32 Connection */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
          </div>
          <div>
            <p className="text-xs font-semibold">ESP32</p>
            <p className="text-[10px] text-green-600">Connected</p>
          </div>
        </div>

        {/* Last Heartbeat */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <Wifi className="w-4 h-4 text-slate-500" />
          <div>
            <p className="text-xs font-semibold">Last Heartbeat</p>
            <p className="text-[10px] text-slate-500 font-mono">{timeAgo(new Date(heartbeatTime - 2000).toISOString())}</p>
          </div>
        </div>

        {/* Simulate Trigger */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <button
            onClick={onSimulate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 border border-amber-500/40 text-amber-600 hover:bg-amber-500/30 text-xs font-medium transition-all"
          >
            <Zap className="w-3.5 h-3.5" />
            Simulate Sensor Trigger
          </button>
        </div>
      </div>

      {/* JSON Payload */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Radio className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs text-slate-500 font-medium">Live JSON Payload</span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse ml-auto" />
        </div>
        <pre className="p-3 rounded-xl bg-black/40 border border-slate-200 overflow-x-auto text-[11px] font-mono leading-relaxed">
          <code>
            {jsonPayload.split("\n").map((line, i) => {
              const isKey = /"[^"]+":/.test(line);
              const isString = /"[^"]*"/.test(line);
              const isNum = /:\s*[\d.]+/.test(line);
              const isBool = /:\s*(true|false)/.test(line);
              let color = "text-slate-700";
              if (isKey) color = "text-violet-600";
              else if (isString) color = "text-green-600";
              else if (isNum) color = "text-amber-600";
              else if (isBool) color = "text-violet-600";
              return (
                <span key={i} className="block">
                  <span className="text-slate-400 select-none mr-4">{String(i + 1).padStart(2, " ")}</span>
                  <span className={color}>{line}</span>
                </span>
              );
            })}
          </code>
        </pre>
      </div>
    </div>
  );
}

function LiveIndicator() {
  return (
    <div className="flex items-center gap-2 text-xs font-mono text-green-600">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
      </span>
      LIVE
    </div>
  );
}

export default function SensorsPage() {
  const { sensors: storeSensors, updateSensor, addTimelineEvent } = useData();
  
  // Fallback to mock data if store is empty to prevent 'blank' UI
  const sensors = useMemo(() => {
    if (storeSensors && storeSensors.length > 0) return storeSensors;
    return [
      { id: "S-001", name: "Temperature Sensor", type: "DHT22", status: "Online", value: 24.5, lastUpdated: new Date().toISOString(), history: [] },
      { id: "S-002", name: "Humidity Sensor", type: "DHT22", status: "Online", value: 45, lastUpdated: new Date().toISOString(), history: [] },
      { id: "S-003", name: "Air Quality Monitor", type: "MQ-135", status: "Online", value: 120, lastUpdated: new Date().toISOString(), history: [] },
      { id: "S-004", name: "GPS Tracker", type: "GPS", status: "Online", value: "13.0827°N, 80.2707°E", lastUpdated: new Date().toISOString(), history: [] },
    ] as SensorDevice[];
  }, [storeSensors]);

  const sensorsRef = useRef(sensors);
  useEffect(() => { sensorsRef.current = sensors; }, [sensors]);
  
  const [lastReading, setLastReading] = useState<SensorReading | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [renderTick, setRenderTick] = useState(0);
  const [espIp, setEspIp] = useState("192.168.1.10");
  const [camIp, setCamIp] = useState("192.168.1.20");
  const [connStatus, setConnStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [motionAlert, setMotionAlert] = useState(false);
  
  const initialized = useRef(false);

  const handleConnect = () => {
    setConnStatus("connecting");
    setTimeout(() => {
      setConnStatus("connected");
      setNotification("ESP32 Connection Established");
      setTimeout(() => setNotification(null), 3000);
    }, 2000);
  };

  const captureSnapshot = () => {
    if (connStatus !== "connected") return;
    
    setNotification("Surveillance Snapshot Captured");
    setTimeout(() => setNotification(null), 3000);

    addTimelineEvent({
      caseId: "CI-moysc29b-5CVQ",
      type: "CCTV",
      title: "Evidence Zone Snapshot",
      description: "Automated high-definition snapshot captured from ESP32-CAM surveillance stream.",
      timestamp: new Date().toISOString(),
      confidence: 98,
    });
  };

  const handleSensorUpdate = useCallback((reading: SensorReading) => {
    setLastReading(reading);
    const currentSensors = sensorsRef.current;

    // Trigger motion alert logic
    if (reading.motion) {
      setMotionAlert(true);
      setTimeout(() => setMotionAlert(false), 5000);
    }

    const tempSensor = currentSensors.find((s) => s.name === "Temperature Sensor");
    if (tempSensor) {
      const v = parseFloat(reading.temperature.toFixed(1));
      updateSensor(tempSensor.id, {
        value: v,
        lastUpdated: new Date().toISOString(),
        history: [...tempSensor.history.slice(-59), { value: v, timestamp: new Date().toISOString() }],
      });
    }

    const humSensor = currentSensors.find((s) => s.name === "Humidity Sensor");
    if (humSensor) {
      const v = Math.round(reading.humidity);
      updateSensor(humSensor.id, {
        value: v,
        lastUpdated: new Date().toISOString(),
        history: [...humSensor.history.slice(-59), { value: v, timestamp: new Date().toISOString() }],
      });
    }

    const aqiSensor = currentSensors.find((s) => s.name === "Air Quality Monitor");
    if (aqiSensor) {
      const v = Math.round(reading.aqi);
      const newStatus: SensorDevice["status"] = v > 200 ? "Alert" : v > 150 ? "Threshold" : "Online";
      updateSensor(aqiSensor.id, {
        value: v,
        status: newStatus,
        lastUpdated: reading.timestamp,
        history: [...aqiSensor.history.slice(-59), { value: v, timestamp: reading.timestamp }],
      });
    }

    const gpsSensor = currentSensors.find((s) => s.name === "GPS Tracker");
    if (gpsSensor) {
      const gpsStr = `${reading.gps.lat.toFixed(4)}°N, ${reading.gps.lng.toFixed(4)}°E`;
      updateSensor(gpsSensor.id, { value: gpsStr, lastUpdated: reading.timestamp });
    }

    // Camera feed status
    const cameraSensor = currentSensors.find((s) => s.name === "Live Camera Feed");
    if (cameraSensor) {
      updateSensor(cameraSensor.id, { 
        status: connStatus === "connected" ? "Online" : "Offline",
        lastUpdated: reading.timestamp 
      });
    }

    setRenderTick((t) => t + 1);
  }, [updateSensor, connStatus]);

  const triggerMotion = useCallback(() => {
    const fakeReading: SensorReading = {
      id: `reading-${Date.now()}`,
      temperature: 30 + Math.random() * 3,
      humidity: 68 + Math.random() * 8,
      motion: true,
      gps: { lat: 13.0827 + Math.random() * 0.001, lng: 80.2707 + Math.random() * 0.001 },
      aqi: 120 + Math.random() * 50,
      vibration: true,
      timestamp: new Date().toISOString(),
    };
    handleSensorUpdate(fakeReading);
  }, [handleSensorUpdate]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const socket = getSocket();
    socket.connect();
    socket.on("sensor-update", (data: unknown) => {
      const reading = data as SensorReading;
      handleSensorUpdate({ ...reading, id: reading.id || `socket-${Date.now()}` });
    });

    return () => {
      socket.off("sensor-update", () => {});
    };
  }, [handleSensorUpdate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-6 animate-grid-bg">
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 20 }}
            className="fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm font-bold shadow-2xl backdrop-blur-md"
          >
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">ESP32 Forensic Surveillance</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time IoT intelligence panel & evidence monitoring</p>
        </div>
        <LiveIndicator />
      </div>

      {/* Primary Intelligence Section */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left: Device Control */}
        <div className="xl:col-span-1 space-y-6">
          <ConnectionPanel 
            status={connStatus} 
            onConnect={handleConnect}
            espIp={espIp}
            setEspIp={setEspIp}
            camIp={camIp}
            setCamIp={setCamIp}
          />
          
          <div className="hidden xl:flex flex-col gap-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Local Node Status</h3>
            {sensors.filter(s => s.type !== "Camera").slice(0, 2).map((sensor) => (
              <motion.div key={sensor.id} variants={itemVariants} initial="hidden" animate="visible">
                <SensorCard sensor={sensor} time={renderTick} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Center: Live Feed */}
        <div className="xl:col-span-3 space-y-6">
          <LiveSurveillanceFeed 
            status={connStatus} 
            onCapture={captureSnapshot} 
            motionDetected={motionAlert} 
          />
        </div>
      </div>

      {/* Secondary Sensor Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sensors.filter(s => s.type !== "Camera").map((sensor) => (
          <motion.div key={sensor.id} variants={itemVariants} initial="hidden" animate="visible">
            <SensorCard sensor={sensor} time={renderTick} />
          </motion.div>
        ))}
      </div>

      {/* Live Data Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-md bg-white/60 hover:bg-white/80 border border-slate-200 rounded-2xl p-4 md:p-6 shadow-sm"
      >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-600" />
                <h2 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Live Telemetry Analysis</h2>
              </div>
              <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />
            </div>
            <LiveDataChart sensors={sensors} time={renderTick} />
          </motion.div>

      {/* Hardware JSON Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <HardwareStatusPanel lastReading={lastReading} onSimulate={triggerMotion} />
      </motion.div>
    </div>
  );
}
