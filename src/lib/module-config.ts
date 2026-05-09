import {
  LayoutDashboard, FolderKanban, Upload, CalendarDays, Map, Radio,
  ShieldCheck, Bell, User, FileText, Microscope, Clock, Activity,
  Bot, Bug, Share2, AlertTriangle, MessageSquare, Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ModuleDefinition {
  key: string;
  href: string;
  label: string;
  icon: LucideIcon;
  isCore: boolean;
  category: string;
  description: string;
}

// ═══════════════════════════════════════════════════════════════
// D1 — Investigation Command Dashboard
// ═══════════════════════════════════════════════════════════════

export const d1Modules: ModuleDefinition[] = [
  // Core — always visible
  { key: "d1-overview",   href: "/d1/overview",   label: "Command Overview",       icon: LayoutDashboard, isCore: true,  category: "Core",           description: "Central command dashboard with case metrics and live feeds." },
  { key: "d1-cases",      href: "/d1/cases",      label: "Cases Management",       icon: FolderKanban,    isCore: true,  category: "Core",           description: "Create, update, and manage investigation cases." },
  { key: "d1-evidence",   href: "/d1/evidence",   label: "Evidence Upload",        icon: Upload,          isCore: true,  category: "Core",           description: "Upload and classify digital evidence files." },
  { key: "d1-timeline",   href: "/d1/timeline",   label: "Investigation Timeline", icon: CalendarDays,    isCore: true,  category: "Core",           description: "Chronological event timeline for active cases." },

  // Optional — hidden by default
  { key: "d1-crime-map",      href: "/d1/crime-map",      label: "Crime Scene Map",    icon: Map,        isCore: false, category: "Field Operations",  description: "Interactive geospatial map of crime scene locations." },
  { key: "d1-sensors",        href: "/d1/sensors",        label: "Live IoT Sensors",   icon: Radio,      isCore: false, category: "Monitoring",        description: "Real-time IoT sensor feeds from the crime scene." },
  { key: "d1-custody",        href: "/d1/custody",        label: "Chain of Custody",   icon: ShieldCheck, isCore: false, category: "Evidence",         description: "Track evidence handling and custody transfers." },
  { key: "d1-notifications",  href: "/d1/notifications",  label: "Alerts & Notifs",    icon: Bell,       isCore: false, category: "Monitoring",        description: "System alerts, sensor warnings, and case notifications." },
  { key: "d1-suspects",       href: "/d1/suspects",       label: "Suspect Tracker",    icon: User,       isCore: false, category: "Investigation",     description: "Manage and track persons of interest." },
  { key: "d1-witnesses",      href: "/d1/witnesses",      label: "Witness Manager",    icon: User,       isCore: false, category: "Investigation",     description: "Record and manage witness statements." },
  { key: "d1-field-reports",   href: "/d1/field-reports",   label: "Field Reports",      icon: FileText,   isCore: false, category: "Investigation",     description: "Generate and review field investigation reports." },
];

// ═══════════════════════════════════════════════════════════════
// D2 — Forensic Science Lab Dashboard
// ═══════════════════════════════════════════════════════════════

export const d2Modules: ModuleDefinition[] = [
  // Core — always visible
  { key: "d2-lab-overview", href: "/d2/lab-overview", label: "Lab Overview",       icon: LayoutDashboard, isCore: true,  category: "Core",       description: "Central forensic laboratory dashboard." },
  { key: "d2-autopsy",     href: "/d2/autopsy",     label: "Autopsy Analysis",   icon: Microscope,      isCore: true,  category: "Core",       description: "AI-assisted post-mortem examination analysis." },
  { key: "d2-image-ai",    href: "/d2/image-ai",    label: "Evidence Image AI",  icon: Bot,             isCore: true,  category: "Core",       description: "AI-powered evidence image classification." },

  // Optional — hidden by default
  { key: "d2-tod",          href: "/d2/tod",          label: "TOD Estimation",      icon: Clock,      isCore: false, category: "Analysis",     description: "Time of Death estimation using Henssge nomogram." },
  { key: "d2-toxicology",   href: "/d2/toxicology",   label: "Toxicology Panel",    icon: Microscope, isCore: false, category: "Lab Science",  description: "Toxicological screening and substance analysis." },
  { key: "d2-wounds",       href: "/d2/wounds",       label: "Wound Analysis",      icon: Activity,   isCore: false, category: "Analysis",     description: "AI-powered wound pattern and injury analysis." },
  { key: "d2-fingerprints", href: "/d2/fingerprints", label: "Fingerprint Vault",   icon: ShieldCheck, isCore: false, category: "Lab Science", description: "AFIS fingerprint matching and database." },
  { key: "d2-dna",          href: "/d2/dna",          label: "DNA & Bio Data",      icon: Activity,   isCore: false, category: "Lab Science",  description: "DNA profiling and biological evidence data." },
  { key: "d2-entomology",   href: "/d2/entomology",   label: "Entomology Log",      icon: Bug,        isCore: false, category: "Analysis",     description: "Insect development analysis for PMI estimation." },
  { key: "d2-decomp",       href: "/d2/decomp",       label: "Decomp Tracker",      icon: Clock,      isCore: false, category: "Analysis",     description: "Decomposition stage tracking with sensor data." },
  { key: "d2-lab-samples",  href: "/d2/lab-samples",  label: "Lab Sample Pipeline", icon: Share2,     isCore: false, category: "Lab Science",  description: "Sample processing workflow and status tracker." },
];

// ═══════════════════════════════════════════════════════════════
// D3 — Intelligence Analytics Dashboard
// ═══════════════════════════════════════════════════════════════

export const d3Modules: ModuleDefinition[] = [
  // Core — always visible
  { key: "d3-intel-overview", href: "/d3/intel-overview", label: "Intelligence Overview", icon: LayoutDashboard, isCore: true,  category: "Core",         description: "Intelligence analytics command center." },
  { key: "d3-correlation",    href: "/d3/correlation",    label: "Correlation Graph",    icon: Share2,          isCore: true,  category: "Core",         description: "Interactive entity relationship graph." },
  { key: "d3-ai-summary",     href: "/d3/ai-summary",     label: "AI Case Summary",      icon: Bot,             isCore: true,  category: "Core",         description: "AI-generated case narrative and insights." },

  // Optional — hidden by default
  { key: "d3-chat",              href: "/d3/chat",              label: "AI Chat",             icon: MessageSquare, isCore: false, category: "AI Tools",      description: "Conversational AI assistant for case queries." },
  { key: "d3-reports",           href: "/d3/reports",           label: "Reports & Export",    icon: FileText,      isCore: false, category: "Reporting",     description: "Generate and export forensic reports." },
  { key: "d3-risk-engine",       href: "/d3/risk-engine",       label: "Risk Score Engine",   icon: Activity,      isCore: false, category: "Analytics",     description: "Composite risk scoring and threat assessment." },
  { key: "d3-behavioral",        href: "/d3/behavioral",        label: "Behavioral Profiler", icon: User,          isCore: false, category: "Analytics",     description: "Behavioral pattern analysis and profiling." },
  { key: "d3-digital-forensics", href: "/d3/digital-forensics", label: "Digital Forensics",   icon: Radio,         isCore: false, category: "Investigation", description: "Digital device and network forensic analysis." },
  { key: "d3-cross-case",        href: "/d3/cross-case",        label: "Cross-Case Links",    icon: Share2,        isCore: false, category: "Analytics",     description: "Cross-case pattern matching and link analysis." },
  { key: "d3-anomalies",         href: "/d3/anomalies",         label: "Anomaly Detection",   icon: AlertTriangle, isCore: false, category: "Analytics",     description: "AI-flagged anomalies and contradictions." },
  { key: "d3-heatmap",           href: "/d3/heatmap",           label: "Evidence Heatmap",    icon: Map,           isCore: false, category: "Analytics",     description: "Geospatial evidence density visualization." },
];

// Settings module definition (shared across all dashboards)
export const settingsModule: ModuleDefinition = {
  key: "settings", href: "", label: "Settings", icon: Settings,
  isCore: true, category: "System", description: "Configure dashboard modules and preferences.",
};

// Helper to get modules for a dashboard
export function getModulesForDashboard(dashboard: "D1" | "D2" | "D3"): ModuleDefinition[] {
  if (dashboard === "D1") return d1Modules;
  if (dashboard === "D2") return d2Modules;
  return d3Modules;
}

// Helper to get all optional module keys for a dashboard
export function getOptionalKeys(dashboard: "D1" | "D2" | "D3"): string[] {
  return getModulesForDashboard(dashboard).filter(m => !m.isCore).map(m => m.key);
}

// Helper to build default enabledModules (all optional = false)
export function getDefaultEnabledModules(): Record<string, boolean> {
  const defaults: Record<string, boolean> = {};
  [...d1Modules, ...d2Modules, ...d3Modules].forEach(m => {
    if (!m.isCore) defaults[m.key] = false;
  });
  return defaults;
}
