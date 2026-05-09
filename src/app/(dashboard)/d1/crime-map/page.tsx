"use client";

import dynamic from "next/dynamic";
import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Activity, Camera, Radio, SlidersHorizontal,
  ChevronDown, ChevronUp, Clock, Layers, Thermometer,
} from "lucide-react";
import { cn, formatTime, timeAgo } from "@/lib/utils";
import { useData } from "@/lib/store";
import type { TimelineEvent } from "@/types";

const MapContent = dynamic(() => import("./MapContent"), { ssr: false });

const typeIcons: Record<string, React.ElementType> = {
  CCTV: Camera, Motion: Activity, GPS: MapPin,
  "Call Log": Radio, "AI Alert": Thermometer,
  "Evidence Upload": Clock, "Sensor Trigger": Radio,
};

const typeColors: Record<string, string> = {
  CCTV: "#3B82F6", Motion: "#F59E0B", GPS: "#10B981",
  "Call Log": "#8B5CF6", "AI Alert": "#EF4444",
  "Evidence Upload": "#00F5FF", "Sensor Trigger": "#F97316",
};

const layers = ["GPS Events", "CCTV", "Motion", "Heatmap mode"] as const;

function EventItem({ event, onSelect, isSelected }: { event: TimelineEvent; onSelect: () => void; isSelected: boolean }) {
  const Icon = typeIcons[event.type] || MapPin;
  const color = typeColors[event.type] || "#6B7280";
  return (
    <motion.div
      whileHover={{ x: 4 }}
      onClick={onSelect}
      className={cn(
        "flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-all",
        isSelected ? "bg-cyan-500/10 border border-cyan-500/30" : "hover:bg-white/5",
      )}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}20`, borderColor: `${color}40`, borderWidth: 1 }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight truncate">{event.title}</p>
        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{event.description}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-mono text-gray-500">{formatTime(event.timestamp)}</span>
          <span className="text-[10px] font-medium px-1 py-0.5 rounded" style={{ backgroundColor: `${color}20`, color }}>{event.type}</span>
          {event.confidence && (
            <span className="text-[10px] text-gray-500">{event.confidence}%</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function CrimeMapPage() {
  const { timelineEvents } = useData();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set(["GPS Events", "CCTV", "Motion"]));
  const [dateRange, setDateRange] = useState<[number, number]>([0, 100]);

  const eventsWithLocation = useMemo(() =>
    timelineEvents.filter((e) => e.location), [timelineEvents]);

  const gpsEvents = useMemo(() =>
    eventsWithLocation.filter((e) => e.type === "GPS").sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()), [eventsWithLocation]);

  const gpsPositions = useMemo(() =>
    gpsEvents.map((e) => [e.location!.lat, e.location!.lng] as [number, number]), [gpsEvents]);

  const filteredEvents = useMemo(() => {
    const times = eventsWithLocation.map((e) => new Date(e.timestamp).getTime());
    const minT = Math.min(...times);
    const maxT = Math.max(...times);
    const range = maxT - minT || 1;
    return eventsWithLocation.filter((e) => {
      const t = new Date(e.timestamp).getTime();
      const pct = ((t - minT) / range) * 100;
      return pct >= dateRange[0] && pct <= dateRange[1];
    });
  }, [dateRange, eventsWithLocation]);

  const filteredForLayer = useMemo(() =>
    filteredEvents.filter((e) => {
      if (e.type === "GPS" && !activeLayers.has("GPS Events")) return false;
      if (e.type === "CCTV" && !activeLayers.has("CCTV")) return false;
      if (e.type === "Motion" && !activeLayers.has("Motion")) return false;
      return true;
    }), [filteredEvents, activeLayers]);

  const toggleLayer = useCallback((layer: string) => {
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });
  }, []);

  const handleEventSelect = useCallback((event: TimelineEvent) => {
    setSelectedEvent(event);
    if (event.location) setMapCenter([event.location.lat, event.location.lng]);
  }, []);

  const minDate = useMemo(() => {
    const times = eventsWithLocation.map((e) => new Date(e.timestamp).getTime());
    return times.length ? new Date(Math.min(...times)) : new Date();
  }, [eventsWithLocation]);

  const maxDate = useMemo(() => {
    const times = eventsWithLocation.map((e) => new Date(e.timestamp).getTime());
    return times.length ? new Date(Math.max(...times)) : new Date();
  }, [eventsWithLocation]);

  const lastUpdateStr = useMemo(() =>
    eventsWithLocation.length === 0 ? "just now" : timeAgo(eventsWithLocation[eventsWithLocation.length - 1].timestamp), [eventsWithLocation]);

  return (
    <div className="relative h-[calc(100vh-5rem)] w-full overflow-hidden rounded-2xl">
      <MapContent
        events={filteredForLayer}
        gpsPositions={gpsPositions}
        selectedEventId={selectedEvent?.id ?? null}
        mapCenter={mapCenter}
        onEventClick={handleEventSelect}
        typeColors={typeColors}
      />

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0, x: -320 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -320 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute top-4 left-4 z-[1000] w-72 max-h-[calc(100%-2rem)] glass overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-cyan-500/10">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Event Layers</h2>
                <Layers className="w-4 h-4 text-cyan-400" />
              </div>
            </div>

            <div className="p-4 border-b border-cyan-500/10 space-y-2">
              {layers.map((layer) => (
                <label key={layer} className="flex items-center gap-2.5 cursor-pointer group">
                  <div
                    onClick={() => toggleLayer(layer)}
                    className={cn(
                      "w-4 h-4 rounded border transition-all flex items-center justify-center",
                      activeLayers.has(layer) || layer === "Heatmap mode"
                        ? "bg-cyan-500 border-cyan-400" : "border-gray-500 group-hover:border-gray-400",
                    )}
                  >
                    {(activeLayers.has(layer) || layer === "Heatmap mode") && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs text-gray-300 group-hover:text-white transition-colors">{layer}</span>
                </label>
              ))}
            </div>

            <div className="p-4 border-b border-cyan-500/10">
              <div className="flex items-center gap-2 mb-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-400 font-medium">Time Filter</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 font-mono shrink-0">
                  {minDate.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                </span>
                <input type="range" min={0} max={100} step={1} value={dateRange[0]}
                  onChange={(e) => setDateRange((prev) => [Math.min(Number(e.target.value), prev[1]), prev[1]])}
                  className="flex-1 h-1 accent-cyan-400" />
                <input type="range" min={0} max={100} step={1} value={dateRange[1]}
                  onChange={(e) => setDateRange((prev) => [prev[0], Math.max(Number(e.target.value), prev[0])])}
                  className="flex-1 h-1 accent-cyan-400" />
                <span className="text-[10px] text-gray-500 font-mono shrink-0">
                  {maxDate.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-gray-600 font-mono">{formatTime(minDate.toISOString())}</span>
                <span className="text-[10px] text-gray-600 font-mono">{formatTime(maxDate.toISOString())}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2 px-1">
                Events ({filteredForLayer.length})
              </p>
              {filteredForLayer.map((event) => (
                <EventItem key={event.id} event={event} isSelected={selectedEvent?.id === event.id} onSelect={() => handleEventSelect(event)} />
              ))}
              {filteredForLayer.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">No events match filters</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setSidebarOpen((p) => !p)}
        className="absolute top-4 z-[1000] glass p-2 rounded-xl hover:bg-white/10 transition-all"
        style={{ left: sidebarOpen ? 304 : 16 }}
      >
        {sidebarOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
      </button>

      <div className="absolute bottom-4 left-4 z-[1000] glass px-4 py-3 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs text-gray-300">Total Events: <span className="font-bold text-white font-mono">{eventsWithLocation.length}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-300">Last Update: <span className="font-mono text-gray-400">{lastUpdateStr}</span></span>
        </div>
      </div>
    </div>
  );
}
