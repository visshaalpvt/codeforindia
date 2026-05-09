"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, Zap, Shield, ToggleLeft, ToggleRight,
  CheckCircle2, XCircle, Sparkles, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useData } from "@/lib/store";
import type { ModuleDefinition } from "@/lib/module-config";

interface SettingsPanelProps {
  dashboard: "D1" | "D2" | "D3";
  title: string;
  subtitle: string;
  modules: ModuleDefinition[];
  accentColor: "cyan" | "amber" | "purple";
}

const accentMap = {
  cyan: {
    text: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    glow: "shadow-[0_0_30px_rgba(6,182,212,0.15)]",
    toggle: "bg-cyan-500",
    toggleGlow: "shadow-[0_0_12px_rgba(6,182,212,0.5)]",
    gradient: "from-cyan-500/20 to-blue-500/10",
    ring: "ring-cyan-500/30",
  },
  amber: {
    text: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    glow: "shadow-[0_0_30px_rgba(245,158,11,0.15)]",
    toggle: "bg-amber-500",
    toggleGlow: "shadow-[0_0_12px_rgba(245,158,11,0.5)]",
    gradient: "from-amber-500/20 to-orange-500/10",
    ring: "ring-amber-500/30",
  },
  purple: {
    text: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    glow: "shadow-[0_0_30px_rgba(139,92,246,0.15)]",
    toggle: "bg-purple-500",
    toggleGlow: "shadow-[0_0_12px_rgba(139,92,246,0.5)]",
    gradient: "from-purple-500/20 to-indigo-500/10",
    ring: "ring-purple-500/30",
  },
};

export default function SettingsPanel({
  dashboard,
  title,
  subtitle,
  modules,
  accentColor,
}: SettingsPanelProps) {
  const { enabledModules, toggleModule } = useData();
  const accent = accentMap[accentColor];

  const optionalModules = useMemo(
    () => modules.filter((m) => !m.isCore),
    [modules]
  );

  const categories = useMemo(() => {
    const catMap = new Map<string, ModuleDefinition[]>();
    optionalModules.forEach((m) => {
      const arr = catMap.get(m.category) || [];
      arr.push(m);
      catMap.set(m.category, arr);
    });
    return Array.from(catMap.entries());
  }, [optionalModules]);

  const enabledCount = optionalModules.filter(
    (m) => enabledModules[m.key]
  ).length;

  const handleEnableAll = () => {
    optionalModules.forEach((m) => {
      if (!enabledModules[m.key]) toggleModule(m.key);
    });
  };

  const handleDisableAll = () => {
    optionalModules.forEach((m) => {
      if (enabledModules[m.key]) toggleModule(m.key);
    });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden"
      >
        <div className={cn("absolute inset-0 bg-gradient-to-r opacity-30 rounded-3xl", accent.gradient)} />
        <div className="relative glass rounded-3xl p-8 border border-white/5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", accent.bg, "border", accent.border, accent.glow)}>
                <Settings className={cn("w-7 h-7", accent.text)} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white font-['Space_Grotesk'] tracking-tight">
                  {title}
                </h1>
                <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5">
                <Layers className={cn("w-4 h-4", accent.text)} />
                <span className="text-xs text-gray-400">
                  <span className={cn("font-bold", accent.text)}>{enabledCount}</span>
                  <span className="text-gray-500"> / {optionalModules.length} active</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={handleEnableAll}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all border",
                accent.bg, accent.border, accent.text,
                "hover:brightness-125"
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Enable All
            </button>
            <button
              onClick={handleDisableAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all border bg-white/[0.03] border-white/10 text-gray-400 hover:text-gray-200 hover:bg-white/5"
            >
              <XCircle className="w-3.5 h-3.5" />
              Disable All
            </button>
            <div className="ml-auto flex items-center gap-2 text-[10px] text-gray-600">
              <Zap className="w-3 h-3" />
              Sidebar updates instantly
            </div>
          </div>
        </div>
      </motion.div>

      {/* Module Categories */}
      <div className="space-y-6">
        {categories.map(([category, mods], ci) => (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: ci * 0.08 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
                {category}
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
              <span className="text-[10px] text-gray-600 font-mono">
                {mods.filter((m) => enabledModules[m.key]).length}/{mods.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <AnimatePresence mode="popLayout">
                {mods.map((mod, mi) => {
                  const Icon = mod.icon;
                  const enabled = !!enabledModules[mod.key];

                  return (
                    <motion.div
                      key={mod.key}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: ci * 0.08 + mi * 0.04 }}
                      className={cn(
                        "group relative rounded-2xl border transition-all duration-300 overflow-hidden",
                        enabled
                          ? cn("bg-gradient-to-br", accent.gradient, accent.border, accent.glow)
                          : "bg-white/[0.02] border-white/5 hover:border-white/10"
                      )}
                    >
                      <div className="p-5 flex items-start gap-4">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300",
                            enabled
                              ? cn(accent.bg, "border", accent.border)
                              : "bg-white/5 border border-white/10"
                          )}
                        >
                          <Icon
                            className={cn(
                              "w-5 h-5 transition-colors duration-300",
                              enabled ? accent.text : "text-gray-500"
                            )}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3
                              className={cn(
                                "text-sm font-bold transition-colors duration-300",
                                enabled ? "text-white" : "text-gray-300"
                              )}
                            >
                              {mod.label}
                            </h3>
                            {enabled && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="shrink-0"
                              >
                                <CheckCircle2 className={cn("w-3.5 h-3.5", accent.text)} />
                              </motion.div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">
                            {mod.description}
                          </p>
                        </div>

                        {/* Toggle Switch */}
                        <button
                          onClick={() => toggleModule(mod.key)}
                          className={cn(
                            "relative w-12 h-6 rounded-full shrink-0 transition-all duration-300",
                            enabled
                              ? cn(accent.toggle, accent.toggleGlow)
                              : "bg-gray-700"
                          )}
                          aria-label={`Toggle ${mod.label}`}
                        >
                          <motion.div
                            className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md"
                            animate={{ x: enabled ? 26 : 2 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        </button>
                      </div>

                      {/* Subtle animated border glow when enabled */}
                      {enabled && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={cn("absolute bottom-0 left-0 right-0 h-[2px]", accent.toggle)}
                        />
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Core Modules Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-2xl p-6 border border-white/5"
      >
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-gray-500" />
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
            Core Modules
          </h3>
          <span className="text-[10px] text-gray-600 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
            Always Active
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {modules
            .filter((m) => m.isCore)
            .map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.key}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5"
                >
                  <Icon className={cn("w-4 h-4", accent.text)} />
                  <span className="text-xs text-gray-300 font-medium">
                    {mod.label}
                  </span>
                </div>
              );
            })}
        </div>
        <p className="text-[10px] text-gray-600 mt-3">
          Core modules cannot be disabled. They are essential for dashboard operation.
        </p>
      </motion.div>
    </div>
  );
}
