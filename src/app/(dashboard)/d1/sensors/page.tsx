"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Thermometer, Droplets, Wind, Activity, Vibrate, MapPin,
  Radio, Cpu, Wifi, Zap, AlertTriangle, RefreshCw,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { cn, formatTime, timeAgo } from "@/lib/utils";
import { generateMockSensorReading } from "@/lib/mock-data";
import { useData } from "@/lib/store";
import { getSocket } from "@/lib/socket";
import type { SensorDevice, SensorReading } from "@/types";

const sensorIcons: Record<string, React.ElementType> = {
  DHT22: Thermometer,
  PIR: Activity,
  "MQ-135": Wind,
  Vibration: Vibrate,
  GPS: MapPin,
};
const sensorColors: Record<string, string> = {
  "Temperature Sensor": "#00F5FF",
  "Humidity Sensor": "#3B82F6",
  "Air Quality Monitor": "#F59E0B",
  "Motion Detector": "#EF4444",
  "Vibration Sensor": "#8B5CF6",
  "GPS Tracker": "#10B981",
};
const sensorUnits: Record<string, string> = {
  "Temperature Sensor": "°C",
  "Humidity Sensor": "%",
  "Air Quality Monitor": "AQI",
  "Motion Detector": "",
  "Vibration Sensor": "",
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
    Online: "bg-green-500/20 text-green-400 border-green-500/30",
    Offline: "bg-red-500/20 text-red-400 border-red-500/30",
    Alert: "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse",
    Threshold: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  };
  const dotColors: Record<string, string> = {
    Online: "bg-green-500",
    Offline: "bg-red-500",
    Alert: "bg-red-500",
    Threshold: "bg-amber-500",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border", colors[status] || "bg-gray-500/20 text-gray-400 border-gray-500/30")}>
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
  const isMotionDetected = sensor.name === "Motion Detector" && sensor.value === "DETECTED";
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
        borderColor: isMotionDetected ? "rgba(239,68,68,0.6)" : undefined,
        boxShadow: isMotionDetected ? "0 0 25px rgba(239,68,68,0.4)" : undefined,
      }}
      transition={{ duration: 0.3 }}
      className={cn(
        "backdrop-blur-md bg-white/5 border rounded-2xl p-4 transition-colors",
        isMotionDetected ? "border-red-500/60" : "border-cyan-500/20",
      )}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">{sensor.name}</p>
            <p className="text-[10px] text-gray-500 font-mono">{sensor.type}</p>
          </div>
        </div>
        <StatusBadge status={sensor.status} />
      </div>

      {/* Large Value */}
      <p className="font-mono font-bold text-3xl md:text-4xl tracking-tight mb-1" style={{ color }}>
        {displayValue}
        {sensorUnits[sensor.name] && (
          <span className="text-lg text-gray-500 ml-1">{sensorUnits[sensor.name]}</span>
        )}
      </p>

      {/* Sparkline */}
      <div className="my-3">
        <SensorSparkline data={sensor.history} color={color} />
      </div>

      {/* Threshold Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-gray-500">
          <span>Threshold</span>
          <span className="font-mono">{Math.round(thresholdPercent)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${thresholdPercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={cn("h-full rounded-full", thresholdColor)}
          />
        </div>
      </div>

      {/* Last Updated */}
      <p className="text-[10px] text-gray-500 mt-3 font-mono">
        Updated {timeAgo(sensor.lastUpdated)}
      </p>
    </motion.div>
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
    <div className="backdrop-blur-md bg-white/5 border border-cyan-500/20 rounded-2xl p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Hardware Status</h2>
        <Cpu className="w-4 h-4 text-cyan-400" />
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
            <p className="text-[10px] text-green-400">Connected</p>
          </div>
        </div>

        {/* Last Heartbeat */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <Wifi className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs font-semibold">Last Heartbeat</p>
            <p className="text-[10px] text-gray-400 font-mono">{timeAgo(new Date(heartbeatTime - 2000).toISOString())}</p>
          </div>
        </div>

        {/* Simulate Trigger */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <button
            onClick={onSimulate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30 text-xs font-medium transition-all"
          >
            <Zap className="w-3.5 h-3.5" />
            Simulate Sensor Trigger
          </button>
        </div>
      </div>

      {/* JSON Payload */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Radio className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-400 font-medium">Live JSON Payload</span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse ml-auto" />
        </div>
        <pre className="p-3 rounded-xl bg-black/40 border border-cyan-500/10 overflow-x-auto text-[11px] font-mono leading-relaxed">
          <code>
            {jsonPayload.split("\n").map((line, i) => {
              const isKey = /"[^"]+":/.test(line);
              const isString = /"[^"]*"/.test(line);
              const isNum = /:\s*[\d.]+/.test(line);
              const isBool = /:\s*(true|false)/.test(line);
              let color = "text-gray-300";
              if (isKey) color = "text-cyan-400";
              else if (isString) color = "text-green-400";
              else if (isNum) color = "text-amber-400";
              else if (isBool) color = "text-purple-400";
              return (
                <span key={i} className="block">
                  <span className="text-gray-600 select-none mr-4">{String(i + 1).padStart(2, " ")}</span>
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
    <div className="flex items-center gap-2 text-xs font-mono text-green-400">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
      </span>
      LIVE
    </div>
  );
}

export default function SensorsPage() {
  const { sensors, updateSensor } = useData();
  const sensorsRef = useRef(sensors);
  useEffect(() => { sensorsRef.current = sensors; }, [sensors]);
  const [lastReading, setLastReading] = useState<SensorReading | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [renderTick, setRenderTick] = useState(0);
  const initialized = useRef(false);

  const handleSensorUpdate = useCallback((reading: SensorReading) => {
    setLastReading(reading);
    const currentSensors = sensorsRef.current;

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

    const motionSensor = currentSensors.find((s) => s.name === "Motion Detector");
    if (motionSensor) {
      const v = reading.motion ? "DETECTED" : "CLEAR";
      const newStatus: SensorDevice["status"] = reading.motion ? "Alert" : "Online";
      if (reading.motion) {
        setNotification("Motion: DETECTED");
        setTimeout(() => setNotification(null), 4000);
      }
      updateSensor(motionSensor.id, { value: v, status: newStatus, lastUpdated: reading.timestamp });
    }

    const vibSensor = currentSensors.find((s) => s.name === "Vibration Sensor");
    if (vibSensor) {
      updateSensor(vibSensor.id, {
        value: reading.vibration,
        lastUpdated: reading.timestamp,
        history: [...vibSensor.history.slice(-59), { value: typeof reading.vibration === "number" ? reading.vibration : 0, timestamp: reading.timestamp }],
      });
    }

    const gpsSensor = currentSensors.find((s) => s.name === "GPS Tracker");
    if (gpsSensor) {
      const gpsStr = `${reading.gps.lat.toFixed(4)}°N, ${reading.gps.lng.toFixed(4)}°E`;
      updateSensor(gpsSensor.id, { value: gpsStr, lastUpdated: reading.timestamp });
    }

    setRenderTick((t) => t + 1);
  }, [updateSensor]);

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

    // We rely on the global simulation in DataProvider now
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
            className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 text-sm font-semibold shadow-lg backdrop-blur-md"
          >
            <AlertTriangle className="w-4 h-4" />
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Live Sensors</h1>
          <p className="text-sm text-gray-400 mt-1">Real-time IoT sensor monitoring</p>
        </div>
        <LiveIndicator />
      </div>

      {/* Sensor Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {sensors.map((sensor) => (
          <motion.div key={sensor.id} variants={itemVariants}>
            <SensorCard sensor={sensor} time={renderTick} />
          </motion.div>
        ))}
      </motion.div>

      {/* Live Data Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-md bg-white/5 border border-cyan-500/20 rounded-2xl p-4 md:p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Live Sensor Data (30 min)</h2>
          <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
        </div>
        <LiveDataChart sensors={sensors} time={renderTick} />
      </motion.div>

      {/* Hardware Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <HardwareStatusPanel lastReading={lastReading} onSimulate={triggerMotion} />
      </motion.div>
    </div>
  );
}
