"use client";

import React from "react";
import { motion } from "framer-motion";
import { Map, Layers, Search, Filter, ShieldAlert, Zap, Radio, Globe, Navigation, Target, Activity } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function EvidenceHeatmapPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-['Space_Grotesk'] tracking-tight">Evidence Heatmap</h1>
          <p className="text-slate-500">Geospatial cluster analysis of forensic evidence and incident density.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 font-bold text-sm hover:text-slate-900 hover:bg-slate-100 transition-all">
            <Layers className="w-4 h-4" /> Toggle Layers
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-slate-900 font-bold text-sm hover:bg-purple-500 transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            <Target className="w-4 h-4" /> Global Cluster Scan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <Card className="xl:col-span-3 bg-white border-white/5 relative overflow-hidden h-[600px] group">
           {/* Simulated Map View */}
           <div className="absolute inset-0 bg-[#0F172A] flex items-center justify-center">
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: `radial-gradient(rgba(139,92,246,0.3) 2px, transparent 2px)`,
                backgroundSize: '30px 30px'
              }} />
              
              {/* Heatmap Blobs Simulation */}
              <motion.div 
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ repeat: Infinity, duration: 4 }}
                className="absolute w-96 h-96 bg-red-100 blur-[100px] rounded-full top-20 left-40" 
              />
              <motion.div 
                animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
                transition={{ repeat: Infinity, duration: 5 }}
                className="absolute w-64 h-64 bg-violet-100 blur-[80px] rounded-full bottom-20 right-40" 
              />
              <div className="absolute w-48 h-48 bg-amber-50 blur-[60px] rounded-full top-1/2 left-1/2" />

              {/* Grid / UI Overlay */}
              <div className="absolute inset-0 border border-white/5 flex flex-col pointer-events-none">
                 <div className="flex-1 border-b border-white/5 flex">
                    <div className="flex-1 border-r border-white/5" />
                    <div className="flex-1 border-r border-white/5" />
                    <div className="flex-1" />
                 </div>
                 <div className="flex-1 flex">
                    <div className="flex-1 border-r border-white/5" />
                    <div className="flex-1 border-r border-white/5" />
                    <div className="flex-1" />
                 </div>
              </div>
              
              <div className="relative z-10 text-center">
                 <Globe className="w-12 h-12 text-slate-900/5 mx-auto mb-4" />
                 <p className="text-[10px] font-mono text-slate-900/20 uppercase tracking-[0.4em]">Rendering Geospatial Intelligence...</p>
              </div>
           </div>

           {/* Map Controls Overlay */}
           <div className="absolute top-6 left-6 space-y-3 z-20">
              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-200 backdrop-blur-md flex flex-col gap-3">
                 <button className="p-2 rounded-lg bg-violet-100 border border-purple-500/30 text-violet-600">
                    <Navigation className="w-4 h-4" />
                 </button>
                 <button className="p-2 rounded-lg hover:bg-slate-50 hover:bg-slate-100 text-slate-400">
                    <Zap className="w-4 h-4" />
                 </button>
                 <button className="p-2 rounded-lg hover:bg-slate-50 hover:bg-slate-100 text-slate-400">
                    <Radio className="w-4 h-4" />
                 </button>
              </div>
           </div>

           <div className="absolute bottom-6 right-6 p-4 rounded-2xl bg-slate-900/40 border border-slate-200 backdrop-blur-md z-20 w-64">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-3">Density Legend</p>
              <div className="space-y-3">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-red-500" />
                       <span className="text-xs text-slate-900">Critical Density</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">14+ Items</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-purple-500" />
                       <span className="text-xs text-slate-900">High Linkage</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">08-13 Items</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-blue-500" />
                       <span className="text-xs text-slate-900">Low Activity</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">01-07 Items</span>
                 </div>
              </div>
           </div>
        </Card>

        <div className="space-y-6">
           <Card className="bg-white border-white/5">
              <CardHeader>
                 <CardTitle className="text-sm text-slate-400 uppercase tracking-widest font-bold">Top Hotspots</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 {[
                   { name: "Sector 7 North", score: 94, trend: "up" },
                   { name: "Industrial Zone 2", score: 82, trend: "down" },
                   { name: "Creek Side West", score: 76, trend: "up" },
                   { name: "Terminal 3 Area", score: 65, trend: "stable" },
                 ].map(spot => (
                   <div key={spot.name} className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-white/5 hover:border-purple-500/30 transition-all cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                         <h4 className="text-sm font-bold text-slate-900">{spot.name}</h4>
                         <span className={cn("text-[10px] font-bold font-mono", 
                           spot.score > 90 ? "text-red-600" : "text-violet-600"
                         )}>{spot.score}</span>
                      </div>
                      <div className="h-1 w-full bg-slate-50 hover:bg-slate-100 rounded-full overflow-hidden">
                         <div className={cn("h-full", 
                           spot.score > 90 ? "bg-red-500" : "bg-purple-500"
                         )} style={{ width: `${spot.score}%` }} />
                      </div>
                   </div>
                 ))}
              </CardContent>
           </Card>

           <Card className="bg-violet-50 border-slate-200">
              <CardContent className="p-6">
                 <div className="flex items-center gap-3 mb-4">
                    <ShieldAlert className="w-5 h-5 text-violet-600" />
                    <span className="text-sm font-bold text-slate-900 uppercase tracking-widest">Risk Alert</span>
                 </div>
                 <p className="text-xs text-violet-600/80 leading-relaxed">
                    A new cluster is forming in the Central District. Pattern matching indicates a 74% probability of a connected event within 48 hours.
                 </p>
                 <button className="w-full mt-4 py-2 rounded-lg bg-purple-500 text-slate-900 text-[10px] font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(139,92,246,0.3)]">
                    Deploy Surveillance
                 </button>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
