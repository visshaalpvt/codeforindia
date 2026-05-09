"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import {
  Activity, AlertTriangle, Radio, FolderKanban,
  TrendingUp, TrendingDown, Users, FileText, Camera, MapPin,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { cn, formatTime, timeAgo, priorityColor, riskColor } from "@/lib/utils";
import { useData } from "@/lib/store";
import { getSocket } from "@/lib/socket";
import type { SensorDevice, Notification, SensorReading } from "@/types";

/* ------------------------------------------------------------------ */
/*  Counting Number component                                          */
/* ------------------------------------------------------------------ */
function CountUp({ target, suffix = "", decimals = 0 }: { target: number; suffix?: string; decimals?: number }) {
  const count = useMotionValue(0);
  const display = useTransform(count, (v) => `${v.toFixed(decimals)}${suffix}`);
  useEffect(() => {
    const controls = animate(count, target, { duration: 1.5, ease: "easeOut" });
    return controls.stop;
  }, [target, count]);
  return <motion.span className="tabular-nums">{display}</motion.span>;
}

/* ------------------------------------------------------------------ */
/*  Stat card                                                          */
/* ------------------------------------------------------------------ */
function StatCard({
  icon: Icon,
  label,
  target,
  trend,
  trendUp,
  color = "text-cyan-400",
  suffix = "",
}: {
  icon: React.ElementType;
  label: string;
  target: number;
  trend?: string;
  trendUp?: boolean;
  color?: string;
  suffix?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-md bg-white/5 border border-cyan-500/20 rounded-2xl p-4 flex items-center gap-4"
    >
      <div className={cn("p-3 rounded-xl bg-white/5 border border-white/10", color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold font-sans mt-0.5">
          <CountUp target={target} suffix={suffix} />
        </p>
      </div>
      {trend && (
        <div className={cn("flex items-center gap-1 text-xs font-medium", trendUp ? "text-green-400" : "text-red-400")}>
          {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trend}
        </div>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sensor card                                                        */
/* ------------------------------------------------------------------ */
function SensorCard({ sensor }: { sensor: SensorDevice }) {
  const statusColor =
    sensor.status === "Online" ? "bg-green-500" :
    sensor.status === "Alert" || sensor.status === "Threshold" ? "bg-amber-500" :
    "bg-red-500";

  const displayValue = typeof sensor.value === "number"
    ? sensor.value.toFixed(1)
    : String(sensor.value);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="backdrop-blur-md bg-white/5 border border-cyan-500/20 rounded-xl p-3"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-400 truncate">{sensor.name}</span>
        <span className={cn("w-2 h-2 rounded-full animate-pulse", statusColor)} />
      </div>
      <p className="text-lg font-bold font-mono">{displayValue}<span className="text-xs text-gray-500 ml-0.5">{sensor.unit}</span></p>
      <p className="text-[10px] text-gray-500 mt-0.5">{formatTime(sensor.lastUpdated)}</p>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Alert toast                                                        */
/* ------------------------------------------------------------------ */
function AlertToast({ notification, onDismiss }: { notification: Notification; onDismiss: () => void }) {
  const severityColorMap: Record<string, string> = {
    critical: "border-red-500/40 bg-red-500/10",
    warning: "border-amber-500/40 bg-amber-500/10",
    info: "border-cyan-500/40 bg-cyan-500/10",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className={cn(
        "backdrop-blur-md border rounded-xl p-3 shadow-lg max-w-sm cursor-pointer",
        severityColorMap[notification.severity ?? "info"] ?? "border-gray-500/20 bg-white/5",
      )}
      onClick={onDismiss}
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className={cn(
          "w-4 h-4 mt-0.5 shrink-0",
          notification.severity === "critical" ? "text-red-400" :
          notification.severity === "warning" ? "text-amber-400" : "text-cyan-400",
        )} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{notification.title}</p>
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{notification.description}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Live indicator                                                     */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function DashboardPage() {
  /* ----- state ----- */
  const { cases, evidence, timelineEvents, sensors, anomalies, notifications, updateSensor, addNotification } = useData();
  const [toasts, setToasts] = useState<Notification[]>([]);
  const [riskScore, setRiskScore] = useState(82);
  const [riskChange, setRiskChange] = useState(1);
  const socketInitialized = useRef(false);

  /* ----- risk trend mock data (7-day rolling) ----- */
  const riskTrendData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const sin = Math.sin(i * 0.6);
    return {
      day: d.toLocaleDateString("en-IN", { weekday: "short" }),
      score: 60 + sin * 15 + (i * 1.5) % 10,
      cases: Math.floor(15 + Math.sin(i * 0.8) * 5 + (i * 2) % 5),
    };
  });

  /* ----- investigation activity bar data ----- */
  const activityData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      day: d.toLocaleDateString("en-IN", { weekday: "short" }),
      uploads: Math.floor(4 + Math.sin(i * 0.7) * 3 + (i * 3) % 4),
      reviews: Math.floor(2 + Math.sin(i * 0.5) * 2 + (i * 1.7) % 3),
    };
  });

  /* ----- evidence type pie data ----- */
  const evidenceTypeCount = evidence.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {});
  const evidencePieData = Object.entries(evidenceTypeCount).map(([name, value]) => ({ name, value }));
  const PIE_COLORS = ["#00F5FF", "#3B82F6", "#F59E0B", "#EF4444", "#10B981", "#8B5CF6"];

  /* ----- timeline preview (last 5) ----- */
  const timelinePreview = timelineEvents.slice(0, 5);

  /* ----- anomaly count ----- */
  const anomalyCount = anomalies.length;

  /* ----- timeline type icons ----- */
  const timelineIcons: Record<string, React.ElementType> = {
    CCTV: Camera,
    "AI Alert": AlertTriangle,
    "Evidence Upload": FileText,
    "Sensor Trigger": Radio,
    GPS: MapPin,
    Motion: Activity,
    "Call Log": Activity,
  };

  /* ----- socket ----- */
  useEffect(() => {
    if (socketInitialized.current) return;
    socketInitialized.current = true;

    const socket = getSocket();
    socket.connect();

    const onSensorUpdate = (data: unknown) => {
      const reading = data as SensorReading;
      updateSensor("S-001", { value: parseFloat(reading.temperature.toFixed(1)), lastUpdated: reading.timestamp });
      updateSensor("S-002", { value: Math.round(reading.humidity), lastUpdated: reading.timestamp });
      updateSensor("S-003", { value: Math.round(reading.aqi), lastUpdated: reading.timestamp });
      updateSensor("S-004", { value: reading.motion ? "DETECTED" : "CLEAR", lastUpdated: reading.timestamp });
    };

    const onAlert = (data: unknown) => {
      const alert = data as Notification;
      setToasts((prev) => [...prev.slice(-2), alert]);
      addNotification({ type: "alert", severity: alert.severity, title: alert.title, description: alert.description, timestamp: alert.timestamp, read: false });
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== alert.id)), 5000);
    };

    const onRiskUpdate = (data: unknown) => {
      const { score, change } = data as { score: number; change: number };
      setRiskScore(score);
      setRiskChange(change);
    };

    socket.on("sensor-update", onSensorUpdate);
    socket.on("alert", onAlert);
    socket.on("risk-update", onRiskUpdate);

    return () => {
      socket.off("sensor-update", onSensorUpdate);
      socket.off("alert", onAlert);
      socket.off("risk-update", onRiskUpdate);
    };
  }, []);

  /* ----- counts ----- */
  const totalCases = cases.length;
  const highRiskCases = cases.filter((c) => c.priority === "Critical" || c.riskScore >= 70).length;
  const activeAlerts = notifications.filter((n) => !n.read).length;
  const onlineSensors = sensors.filter((s) => s.status === "Online").length;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="relative min-h-screen p-4 md:p-6 space-y-6 animate-grid-bg">
      {/* toast stack */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <AlertToast key={t.id} notification={t} onDismiss={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} />
        ))}
      </div>

      {/* header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-sans tracking-tight">
            Command Center
          </h1>
          <p className="text-sm text-gray-400 mt-1">AIVENTRA Forensic Intelligence Dashboard</p>
        </div>
        <div className="flex items-center gap-4">
          <LiveIndicator />
          <motion.div
            key={riskScore}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-bold font-mono border backdrop-blur-sm",
              riskScore >= 70 ? "text-red-400 border-red-500/30 bg-red-500/10" :
              riskScore >= 40 ? "text-amber-400 border-amber-500/30 bg-amber-500/10" :
              "text-green-400 border-green-500/30 bg-green-500/10",
            )}
          >
            Risk: {riskScore}
            <span className={cn("ml-1", riskChange >= 0 ? "text-green-400" : "text-red-400")}>
              {riskChange >= 0 ? "↑" : "↓"}
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* top stats row */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <motion.div variants={itemVariants}><StatCard icon={FolderKanban} label="Total Cases" target={totalCases} trend="+2 this week" trendUp color="text-cyan-400" /></motion.div>
        <motion.div variants={itemVariants}><StatCard icon={AlertTriangle} label="High Risk" target={highRiskCases} trend="+1 vs yesterday" trendUp={false} color="text-red-400" /></motion.div>
        <motion.div variants={itemVariants}><StatCard icon={Activity} label="Active Alerts" target={activeAlerts} trend="3 new" trendUp color="text-amber-400" /></motion.div>
        <motion.div variants={itemVariants}><StatCard icon={Radio} label="Sensor Status" target={onlineSensors} suffix={`/${sensors.length} Online`} trend={onlineSensors === sensors.length ? "All OK" : `${sensors.length - onlineSensors} offline`} trendUp={onlineSensors === sensors.length} color="text-green-400" /></motion.div>
      </motion.div>

      {/* main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ----- left column (60%) ----- */}
        <div className="lg:col-span-3 space-y-6">
          {/* Risk Score Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-md bg-white/5 border border-cyan-500/20 rounded-2xl p-4 md:p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Risk Score Trend</h2>
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={riskTrendData}>
                <defs>
                  <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00F5FF" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#00F5FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: "rgba(17,24,39,0.95)", border: "1px solid rgba(0,245,255,0.2)", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#9CA3AF" }}
                />
                <Area type="monotone" dataKey="score" stroke="#00F5FF" strokeWidth={2} fill="url(#riskGradient)" dot={{ fill: "#00F5FF", r: 3 }} activeDot={{ r: 5, fill: "#00F5FF" }} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Investigation Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-md bg-white/5 border border-cyan-500/20 rounded-2xl p-4 md:p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Investigation Activity</h2>
              <FileText className="w-4 h-4 text-blue-400" />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: "rgba(17,24,39,0.95)", border: "1px solid rgba(0,245,255,0.2)", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#9CA3AF" }}
                />
                <Bar dataKey="uploads" name="Evidence Uploads" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={18} />
                <Bar dataKey="reviews" name="AI Reviews" fill="#00F5FF" radius={[4, 4, 0, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Timeline Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-md bg-white/5 border border-cyan-500/20 rounded-2xl p-4 md:p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Recent Timeline Events</h2>
              <Link href="/timeline" className="text-xs text-cyan-400 hover:underline">View All</Link>
            </div>
            <div className="relative">
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-cyan-500/40 to-transparent" />
              <div className="space-y-4">
                {timelinePreview.map((event) => {
                  const Icon = timelineIcons[event.type] ?? Activity;
                  return (
                    <motion.div
                      key={event.id}
                      whileHover={{ x: 4 }}
                      className="relative pl-8 cursor-pointer"
                    >
                      <div className="absolute left-0 top-0.5 w-6 h-6 rounded-full bg-white/5 border border-cyan-500/30 flex items-center justify-center">
                        <Icon className="w-3 h-3 text-cyan-400" />
                      </div>
                      <p className="text-sm font-semibold leading-tight">{event.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{event.description}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5 font-mono">{timeAgo(event.timestamp)}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ----- right column (40%) ----- */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Sensor Feed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-md bg-white/5 border border-cyan-500/20 rounded-2xl p-4 md:p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Live Sensor Feed</h2>
              <Radio className="w-4 h-4 text-green-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {sensors.slice(0, 4).map((s) => (
                <SensorCard key={s.id} sensor={s} />
              ))}
            </div>
          </motion.div>

          {/* Recent Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-md bg-white/5 border border-cyan-500/20 rounded-2xl p-4 md:p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Recent Alerts</h2>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {notifications.slice(0, 10).map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn(
                    "flex items-start gap-3 p-2.5 rounded-xl border text-sm transition-colors",
                    alert.severity === "critical" ? "border-red-500/20 bg-red-500/5" :
                    alert.severity === "warning" ? "border-amber-500/20 bg-amber-500/5" :
                    "border-white/5 bg-white/[0.02]",
                  )}
                >
                  {alert.severity && (
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                      alert.severity === "critical" ? "text-red-400 bg-red-500/10" :
                      alert.severity === "warning" ? "text-amber-400 bg-amber-500/10" :
                      "text-cyan-400 bg-cyan-500/10",
                    )}>
                      {alert.severity}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold leading-tight">{alert.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{alert.description}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 font-mono">{timeAgo(alert.timestamp)}</p>
                  </div>
                </motion.div>
              ))}
              {notifications.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No alerts</p>
              )}
            </div>
          </motion.div>

          {/* AI Anomaly Count */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-md bg-white/5 border border-cyan-500/20 rounded-2xl p-4 md:p-6 text-center"
          >
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-2">AI Anomalies Detected</h2>
            <motion.p
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 150, damping: 12, delay: 0.3 }}
              className="text-5xl md:text-6xl font-bold font-mono text-red-400"
            >
              <CountUp target={anomalyCount} />
            </motion.p>
            <p className="text-xs text-gray-400 mt-2">
              {anomalies.filter((a) => a.severity === "Critical").length} Critical &middot;{" "}
              {anomalies.filter((a) => a.severity === "High").length} High
            </p>
          </motion.div>
        </div>
      </div>

      {/* ----- bottom row ----- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Active Cases Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="xl:col-span-2 backdrop-blur-md bg-white/5 border border-cyan-500/20 rounded-2xl p-4 md:p-6 overflow-x-auto"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Active Cases</h2>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs uppercase tracking-wider border-b border-white/5">
                <th className="pb-2 font-medium">Case ID</th>
                <th className="pb-2 font-medium">Victim</th>
                <th className="pb-2 font-medium">Officer</th>
                <th className="pb-2 font-medium">Priority</th>
                <th className="pb-2 font-medium">Risk</th>
                <th className="pb-2 font-medium">Progress</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {cases.filter((c) => c.status !== "Closed" && c.status !== "Archived").map((c) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileHover={{ backgroundColor: "rgba(0,245,255,0.03)" }}
                  className="border-b border-white/[0.02]"
                >
                  <td className="py-3 pr-4 font-mono text-xs text-cyan-400">{c.id}</td>
                  <td className="py-3 pr-4 font-medium">{c.victim}</td>
                  <td className="py-3 pr-4 text-gray-400 text-xs">{c.officer}</td>
                  <td className="py-3 pr-4">
                    <span className={cn("text-xs font-semibold", priorityColor(c.priority))}>{c.priority}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={cn("font-mono text-xs font-bold", riskColor(c.riskScore))}>{c.riskScore}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden w-20">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(c.evidenceCount * 6, 100)}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={cn(
                            "h-full rounded-full",
                            c.riskScore >= 70 ? "bg-red-500" : c.riskScore >= 40 ? "bg-amber-500" : "bg-green-500",
                          )}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">{Math.min(c.evidenceCount * 6, 100)}%</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-semibold border",
                      c.status === "Active" ? "text-green-400 border-green-500/30 bg-green-500/10" :
                      c.status === "Pending" ? "text-amber-400 border-amber-500/30 bg-amber-500/10" :
                      "text-gray-400 border-gray-500/30 bg-gray-500/10",
                    )}>
                      {c.status}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Evidence Upload Stats PieChart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-md bg-white/5 border border-cyan-500/20 rounded-2xl p-4 md:p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Evidence Distribution</h2>
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={evidencePieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {evidencePieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "rgba(17,24,39,0.95)", border: "1px solid rgba(0,245,255,0.2)", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#9CA3AF" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {evidencePieData.map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-gray-400">{entry.name}</span>
                <span className="font-mono text-gray-500">{entry.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
