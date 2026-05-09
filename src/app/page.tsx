"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, Microscope, Brain, ArrowRight, Activity, Zap, ChevronRight, Lock, Fingerprint, Database, Radio, Bot, BarChart3, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  { icon: Shield, title: "Investigation Command", desc: "Field operations, suspect tracking, witness management, and live crime scene mapping with IoT sensor integration.", color: "text-violet-600", bg: "bg-violet-50" },
  { icon: Microscope, title: "Forensic Science Lab", desc: "AI-powered autopsy, toxicology screening, DNA profiling, wound analysis, and entomology-based time-of-death estimation.", color: "text-amber-600", bg: "bg-amber-50" },
  { icon: Brain, title: "Intelligence Analytics", desc: "Neural risk scoring, behavioral profiling, cross-case link discovery, anomaly detection, and predictive threat modeling.", color: "text-violet-600", bg: "bg-violet-50" },
];

const stats = [
  { value: "33+", label: "Forensic Modules" },
  { value: "3", label: "Specialized Dashboards" },
  { value: "AI", label: "Gemma-Powered Analysis" },
  { value: "24/7", label: "Real-time Monitoring" },
];

const capabilities = [
  { icon: Bot, title: "AI Forensic Engine", desc: "Gemma AI generates cause-of-death determinations, toxicology interpretations, and behavioral predictions." },
  { icon: Radio, title: "Live IoT Sensors", desc: "Real-time environmental monitoring from crime scenes — temperature, humidity, air quality feeding directly into TOD calculations." },
  { icon: Database, title: "AFIS & CODIS Integration", desc: "Fingerprint ridge analysis and DNA STR profiling connected to national forensic databases for instant matching." },
  { icon: BarChart3, title: "Anomaly Detection", desc: "Statistical outlier detection across all case data — flagging evidence inconsistencies humans would miss." },
  { icon: Layers, title: "Cross-Case Intelligence", desc: "Automated discovery of hidden connections between independent investigations across jurisdictions." },
  { icon: Lock, title: "Chain of Custody", desc: "Court-admissible evidence tracking with tamper-proof logging of every access, transfer, and analysis." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-100 border border-slate-300 flex items-center justify-center">
              <Shield className="w-4 h-4 text-violet-600" />
            </div>
            <span className="text-lg font-bold font-['Space_Grotesk'] tracking-tight text-slate-900">AIVENTRA</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Features</a>
            <a href="#capabilities" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Capabilities</a>
            <a href="#dashboards" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Dashboards</a>
          </div>
          <Link
            href="/login"
            className="px-5 py-2 rounded-xl bg-cyan-500 text-slate-900 text-sm font-bold hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          >
            Access System →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute inset-0 opacity-15" style={{
          backgroundImage: `linear-gradient(rgba(6,182,212,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.1) 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }} />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-cyan-500/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 blur-[120px] rounded-full" />

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-50 border border-slate-200 mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[11px] font-bold text-violet-600 uppercase tracking-widest">Government Forensic Intelligence Platform</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold font-['Space_Grotesk'] tracking-tighter leading-[1.05] mb-6">
              AI-Powered{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
                Forensic Analysis
              </span>{" "}
              at Scale
            </h1>

            <p className="text-lg text-slate-500 leading-relaxed mb-10 max-w-2xl">
              AIVENTRA unifies crime scene investigation, laboratory analysis, and intelligence analytics into a single AI-driven platform. 
              From evidence collection to court-ready reports — powered by the Gemma neural engine.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-cyan-500 text-slate-900 font-bold text-sm hover:bg-cyan-400 transition-all shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)]"
              >
                Access System <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 hover:bg-slate-100 transition-all"
              >
                Explore Features <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {stats.map((stat, i) => (
              <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-white/5 text-center">
                <p className="text-3xl font-bold text-slate-900 font-mono mb-1">{stat.value}</p>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Dashboards */}
      <section id="dashboards" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[11px] font-bold text-violet-600 uppercase tracking-[0.3em] mb-3">3 Specialized Workspaces</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 font-['Space_Grotesk'] tracking-tight">Role-Based Dashboards</h2>
            <p className="text-slate-400 mt-3 max-w-lg mx-auto text-sm">Each dashboard is purpose-built for a specific forensic role with dedicated tools, AI models, and data views.</p>
          </div>

          <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="p-8 rounded-3xl bg-slate-50 border border-white/5 hover:border-white/15 transition-all group"
              >
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110", f.bg)}>
                  <f.icon className={cn("w-7 h-7", f.color)} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 font-['Space_Grotesk']">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section id="capabilities" className="py-20 px-6 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[11px] font-bold text-amber-600 uppercase tracking-[0.3em] mb-3">Core Technology</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 font-['Space_Grotesk'] tracking-tight">Platform Capabilities</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((cap, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl border border-white/5 hover:bg-slate-50 transition-all group"
              >
                <cap.icon className="w-6 h-6 text-violet-600 mb-4 group-hover:scale-110 transition-transform" />
                <h4 className="text-sm font-bold text-slate-900 mb-2 uppercase tracking-wide">{cap.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{cap.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 font-['Space_Grotesk'] tracking-tight mb-4">
            Ready to Begin Analysis?
          </h2>
          <p className="text-slate-500 mb-8">Access the forensic intelligence system with your role-based credentials.</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-cyan-500 text-slate-900 font-bold hover:bg-cyan-400 transition-all shadow-[0_0_30px_rgba(6,182,212,0.3)]"
          >
            Access AIVENTRA <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-violet-600/50" />
            <span className="text-xs text-slate-400">AIVENTRA Forensic Intelligence System</span>
          </div>
          <p className="text-[10px] text-gray-700">&copy; {new Date().getFullYear()} Restricted Government Access. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
