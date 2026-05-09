import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(date: string): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const intervals: [number, string][] = [
    [31536000, "y"], [2592000, "mo"], [86400, "d"],
    [3600, "h"], [60, "m"], [1, "s"],
  ];
  for (const [secs, label] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `${count}${label} ago`;
  }
  return "just now";
}

export function severityColor(severity: string): string {
  switch (severity) {
    case "Critical": return "text-red-600 border-slate-300 bg-red-500/10";
    case "High": return "text-amber-600 border-amber-500/40 bg-amber-50";
    case "Medium": return "text-yellow-400 border-yellow-500/40 bg-yellow-500/10";
    case "Low": return "text-green-600 border-green-500/40 bg-green-500/10";
    default: return "text-slate-500 border-gray-500/40 bg-gray-500/10";
  }
}

export function priorityColor(priority: string): string {
  switch (priority) {
    case "Critical": return "text-red-600";
    case "High": return "text-amber-600";
    case "Medium": return "text-yellow-400";
    case "Low": return "text-green-600";
    default: return "text-slate-500";
  }
}

export function riskColor(score: number): string {
  if (score >= 70) return "text-red-600";
  if (score >= 40) return "text-amber-600";
  return "text-green-600";
}

export function riskBgColor(score: number): string {
  if (score >= 70) return "bg-red-100 border-slate-300";
  if (score >= 40) return "bg-amber-100 border-amber-500/40";
  return "bg-green-100 border-green-500/40";
}
