"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Footprints, MapPin, Phone, AlertTriangle,
  Upload, Radio, Play, Pause, SkipBack, SkipForward,
  Clock, Filter, ChevronDown,
} from "lucide-react";
import { cn, formatTime, formatDate } from "@/lib/utils";
import { useData } from "@/lib/store";
import type { TimelineEvent } from "@/types";

const eventTypes = [
  "All", "CCTV", "Motion", "GPS", "Call Log", "AI Alert", "Evidence Upload", "Sensor Trigger",
] as const;

const zoomLevels = ["Hour", "6H", "Day", "Week", "Month"] as const;

const playbackSpeeds = [0.5, 1, 2, 5] as const;

const typeConfig: Record<string, { icon: typeof Camera; color: string; bg: string; border: string }> = {
  CCTV:            { icon: Camera,       color: "text-blue-400",      bg: "bg-blue-500/10",      border: "border-blue-500/30" },
  Motion:          { icon: Footprints,   color: "text-amber-400",     bg: "bg-amber-500/10",     border: "border-amber-500/30" },
  GPS:             { icon: MapPin,       color: "text-green-400",     bg: "bg-green-500/10",     border: "border-green-500/30" },
  "Call Log":      { icon: Phone,        color: "text-purple-400",    bg: "bg-purple-500/10",    border: "border-purple-500/30" },
  "AI Alert":      { icon: AlertTriangle,color: "text-red-400",       bg: "bg-red-500/10",       border: "border-red-500/30" },
  "Evidence Upload":{ icon: Upload,      color: "text-cyan-400",      bg: "bg-cyan-500/10",      border: "border-cyan-500/30" },
  "Sensor Trigger": { icon: Radio,       color: "text-orange-400",    bg: "bg-orange-500/10",    border: "border-orange-500/30" },
};

function confidenceColor(score: number): string {
  if (score >= 85) return "bg-green-500";
  if (score >= 70) return "bg-amber-500";
  return "bg-red-500";
}

function confidenceTextColor(score: number): string {
  if (score >= 85) return "text-green-400";
  if (score >= 70) return "text-amber-400";
  return "text-red-400";
}

/* ------------------------------------------------------------------ */
/*  Event Card                                                         */
/* ------------------------------------------------------------------ */
function EventCard({
  event,
  isActive,
  index,
  onDelete,
}: {
  event: TimelineEvent;
  isActive: boolean;
  index: number;
  onDelete?: (id: string) => void;
}) {
  const cfg = typeConfig[event.type] ?? typeConfig["CCTV"];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{
        opacity: 1,
        x: 0,
        scale: isActive ? 1.02 : 1,
        borderColor: isActive ? "rgba(0,245,255,0.6)" : undefined,
      }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className={cn(
        "relative flex gap-4 p-4 rounded-xl border transition-all duration-500",
        isActive
          ? "bg-cyan-500/10 border-cyan-400/60 shadow-[0_0_30px_rgba(0,245,255,0.15)]"
          : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06]",
      )}
    >
      {/* Time Column */}
      <div className="shrink-0 w-16 pt-1 text-right">
        <p className="text-xs font-mono text-cyan-400 font-bold">{formatTime(event.timestamp)}</p>
        <p className="text-[10px] font-mono text-gray-500">{formatDate(event.timestamp)}</p>
      </div>

      {/* Timeline Dot + Connector */}
      <div className="relative flex flex-col items-center shrink-0">
        <div className={cn(
          "w-5 h-5 rounded-full border-2 flex items-center justify-center z-10 transition-colors duration-500",
          isActive ? "border-cyan-400 bg-cyan-500/30" : `${cfg.bg} ${cfg.border}`,
        )}>
          <Icon className={cn("w-2.5 h-2.5", isActive ? "text-white" : cfg.color)} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn(
            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
            cfg.bg, cfg.border, cfg.color,
          )}>
            {event.type}
          </span>
          <h3 className="text-sm font-semibold text-white">{event.title}</h3>
          {onDelete && (
            <button
              onClick={() => onDelete(event.id)}
              className="ml-auto text-gray-500 hover:text-red-400 transition-colors p-1"
              title="Delete event"
            >
              <span className="text-xs font-bold">&times;</span>
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">{event.description}</p>

        {/* Confidence Bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden max-w-[160px]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${event.confidence}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.05 }}
              className={cn("h-full rounded-full", confidenceColor(event.confidence))}
            />
          </div>
          <span className={cn("text-[10px] font-mono font-bold", confidenceTextColor(event.confidence))}>
            {event.confidence}%
          </span>
        </div>

        {event.location && (
          <p className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {event.location.lat.toFixed(4)}, {event.location.lng.toFixed(4)}
          </p>
        )}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function TimelinePage() {
  const { timelineEvents, deleteTimelineEvent, cases } = useData();

  /* ----- state ----- */
  const [selectedCase, setSelectedCase] = useState("");
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set(eventTypes));
  const [zoom, setZoom] = useState<typeof zoomLevels[number]>("Day");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [playIndex, setPlayIndex] = useState(0);
  const playbackRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ----- derived data ----- */
  const filtered = useMemo(() => {
    let list = [...timelineEvents];
    if (selectedCase) list = list.filter((e) => e.caseId === selectedCase);
    if (!activeTypes.has("All")) {
      list = list.filter((e) => activeTypes.has(e.type));
    }
    list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return list;
  }, [selectedCase, activeTypes, timelineEvents]);

  const caseOptions = useMemo(() => {
    const ids = new Set(timelineEvents.map((e) => e.caseId));
    return cases.filter((c) => ids.has(c.id));
  }, [timelineEvents, cases]);

  /* ----- filter toggle ----- */
  const toggleType = useCallback((type: string) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (type === "All") {
        if (prev.has("All")) return new Set();
        return new Set(eventTypes);
      }
      next.delete("All");
      if (next.has(type)) next.delete(type);
      else next.add(type);
      if (next.size === 0) next.add("All");
      if (next.size === eventTypes.length - 1) return new Set(eventTypes);
      return next;
    });
  }, []);

  /* ----- playback ----- */
  const startPlayback = useCallback(() => {
    if (filtered.length === 0) return;
    setIsPlaying(true);
    setPlayIndex(0);
  }, [filtered.length]);

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    if (playbackRef.current) {
      clearInterval(playbackRef.current);
      playbackRef.current = null;
    }
  }, []);

  const togglePlayback = useCallback(() => {
    if (isPlaying) { stopPlayback(); return; }
    if (playIndex >= filtered.length) {
      setPlayIndex(0);
    }
    startPlayback();
  }, [isPlaying, playIndex, filtered.length, stopPlayback, startPlayback]);

  useEffect(() => {
    if (!isPlaying) return;
    playbackRef.current = setInterval(() => {
      setPlayIndex((prev) => {
        const next = prev + 1;
        if (next >= filtered.length) {
          setIsPlaying(false);
          return 0;
        }
        return next;
      });
    }, 3000 / playbackSpeed);
    return () => {
      if (playbackRef.current) clearInterval(playbackRef.current);
    };
  }, [isPlaying, playbackSpeed, filtered.length]);

  useEffect(() => {
    return () => {
      if (playbackRef.current) clearInterval(playbackRef.current);
    };
  }, []);

  const progress = filtered.length > 0 ? ((playIndex) / filtered.length) * 100 : 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
  };

  return (
    <div className="space-y-6 animate-grid-bg">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold tracking-tight">Timeline</h1>
        <p className="text-sm text-gray-400 mt-1">Chronological event sequencing with AI-powered playback</p>
      </motion.div>

      {/* Controls Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-4 space-y-4"
      >
        {/* Row 1: Case selector + date range */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Case Selector */}
            <div className="relative">
              <select
                value={selectedCase}
                onChange={(e) => setSelectedCase(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 rounded-lg bg-white/5 border border-cyan-500/20 text-sm text-gray-300 focus:outline-none focus:border-cyan-500/50 cursor-pointer min-w-[160px]"
              >
                <option value="">All Cases</option>
                {caseOptions.map((c) => (
                  <option key={c.id} value={c.id}>{c.id} — {c.victim}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
            </div>

            {/* Date Range Display */}
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono bg-white/5 px-3 py-2 rounded-lg border border-white/10">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              {filtered.length > 0 ? (
                <>
                  {formatDate(filtered[0].timestamp)} — {formatDate(filtered[filtered.length - 1].timestamp)}
                </>
              ) : "No events"}
            </div>
          </div>

          {/* Animate Playback Button */}
          <button
            onClick={togglePlayback}
            disabled={filtered.length === 0}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all",
              isPlaying
                ? "bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30"
                : "bg-cyan-500/20 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/30",
              filtered.length === 0 && "opacity-40 cursor-not-allowed",
            )}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? "Pause" : "Animate Playback"}
          </button>
        </div>

        {/* Row 2: Filter Chips + Zoom */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Type Filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-gray-500 mr-1 shrink-0" />
            {eventTypes.map((type) => {
              const isActive = activeTypes.has(type);
              const cfg = type === "All" ? null : typeConfig[type];
              return (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleType(type)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                    isActive
                      ? cfg
                        ? `${cfg.bg} ${cfg.border} ${cfg.color}`
                        : "bg-cyan-500/20 border-cyan-500/40 text-cyan-400"
                      : "bg-white/[0.03] border-white/10 text-gray-500 hover:text-gray-300",
                  )}
                >
                  {cfg && <cfg.icon className="w-3 h-3" />}
                  {type}
                </motion.button>
              );
            })}
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center bg-white/5 rounded-lg border border-white/10 p-0.5">
            {zoomLevels.map((level) => (
              <button
                key={level}
                onClick={() => setZoom(level)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  zoom === level
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    : "text-gray-500 hover:text-gray-300 border border-transparent",
                )}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Playback Progress Bar */}
        <AnimatePresence>
          {isPlaying && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setPlayIndex(0); }}
                  className="text-gray-500 hover:text-cyan-400 transition-colors"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                {playbackSpeeds.map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setPlaybackSpeed(speed)}
                    className={cn(
                      "px-2 py-0.5 rounded text-xs font-mono font-bold transition-all",
                      playbackSpeed === speed
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        : "text-gray-500 hover:text-gray-300",
                    )}
                  >
                    {speed}x
                  </button>
                ))}

                <button
                  onClick={() => { setPlayIndex(filtered.length - 1); stopPlayback(); }}
                  className="text-gray-500 hover:text-cyan-400 transition-colors"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                <span className="text-xs font-mono text-gray-400 ml-auto">
                  {playIndex + 1} / {filtered.length}
                </span>
              </div>

              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Timeline Events */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative"
      >
        {/* Vertical axis line */}
        <div className="absolute left-[100px] top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/30 via-cyan-500/10 to-transparent" />

        <div className="space-y-2">
          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-gray-500"
            >
              <Clock className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm">No timeline events match your filters</p>
              <p className="text-xs text-gray-600 mt-1">Try adjusting the case or event type selection</p>
            </motion.div>
          )}

          {filtered.map((event, i) => (
            <EventCard
              key={event.id}
              event={event}
              index={i}
              isActive={isPlaying && i === playIndex}
              onDelete={deleteTimelineEvent}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
