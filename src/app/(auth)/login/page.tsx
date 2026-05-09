"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Fingerprint, Eye, EyeOff, Loader2, Shield, Microscope, Brain, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/store";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

const roles = [
  {
    id: "investigator",
    label: "Investigation Officer",
    email: "investigator@aiventra.gov",
    password: "invest@123",
    icon: Shield,
    color: "cyan",
    accent: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-slate-300",
    dashboard: "D1",
    desc: "Field operations & case management",
  },
  {
    id: "scientist",
    label: "Lab Scientist",
    email: "scientist@aiventra.gov",
    password: "labsci@123",
    icon: Microscope,
    color: "amber",
    accent: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-500/30",
    dashboard: "D2",
    desc: "Forensic analysis & lab workflows",
  },
  {
    id: "analyst",
    label: "Intelligence Analyst",
    email: "analyst@aiventra.gov",
    password: "intel@123",
    icon: Brain,
    color: "purple",
    accent: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-purple-500/30",
    dashboard: "D3",
    desc: "Pattern recognition & AI analytics",
  },
];

const dashboardPaths: Record<string, string> = {
  D1: "/d1/overview",
  D2: "/d2/lab-overview",
  D3: "/d3/intel-overview",
};

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { setDashboard } = useData();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(roles[0]);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: roles[0].email, password: roles[0].password },
  });

  const selectRole = (role: typeof roles[0]) => {
    setSelectedRole(role);
    setValue("email", role.email);
    setValue("password", role.password);
    setError("");
  };

  async function onSubmit(data: LoginForm) {
    setIsLoading(true);
    setError("");
    const result = await login(data.email, data.password);
    setIsLoading(false);
    if (!result.success) {
      setError(result.error || "Login failed");
      return;
    }
    setDashboard(selectedRole.dashboard as "D1" | "D2" | "D3");
    router.push("/select-dashboard");
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `linear-gradient(rgba(6,182,212,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.08) 1px, transparent 1px)`,
        backgroundSize: '80px 80px'
      }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-20 w-full max-w-lg px-4"
      >
        <div className="backdrop-blur-md bg-white/[0.03] border border-slate-200 rounded-3xl p-8 shadow-[0_0_60px_rgba(0,0,0,0.4)]">
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <Shield className="w-10 h-10 text-violet-600" />
              <div className="absolute inset-0 blur-xl bg-violet-200 rounded-full" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 font-['Space_Grotesk'] tracking-tight">
              AIVENTRA
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Forensic Intelligence System — Secure Access
            </p>
          </div>

          {/* Role Selector */}
          <div className="mb-6">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-3">Select Your Role</p>
            <div className="grid grid-cols-3 gap-2">
              {roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => selectRole(role)}
                  className={cn(
                    "p-3 rounded-xl border transition-all duration-300 text-center group",
                    selectedRole.id === role.id
                      ? cn(role.bg, role.border, "shadow-lg")
                      : "bg-slate-50 border-white/5 hover:border-white/15"
                  )}
                >
                  <role.icon className={cn("w-5 h-5 mx-auto mb-2", selectedRole.id === role.id ? role.accent : "text-slate-400")} />
                  <p className={cn("text-[10px] font-bold uppercase tracking-wide", selectedRole.id === role.id ? role.accent : "text-slate-400")}>
                    {role.id === "investigator" ? "Officer" : role.id === "scientist" ? "Scientist" : "Analyst"}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Role Info */}
          <div className={cn("mb-6 p-3 rounded-xl border flex items-center gap-3", selectedRole.bg, selectedRole.border)}>
            <selectedRole.icon className={cn("w-5 h-5 shrink-0", selectedRole.accent)} />
            <div>
              <p className={cn("text-xs font-bold", selectedRole.accent)}>{selectedRole.label}</p>
              <p className="text-[10px] text-slate-400">{selectedRole.desc}</p>
            </div>
            <ChevronRight className={cn("w-4 h-4 ml-auto", selectedRole.accent)} />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Email</label>
              <input
                {...register("email")}
                type="email"
                className={cn(
                  "w-full px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border text-slate-900 placeholder-gray-600 outline-none transition-all text-sm",
                  "focus:border-slate-400 focus:shadow-[0_0_12px_rgba(0,245,255,0.1)]",
                  errors.email ? "border-red-500/60" : "border-slate-200"
                )}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  className={cn(
                    "w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-50 hover:bg-slate-100 border text-slate-900 placeholder-gray-600 outline-none transition-all text-sm",
                    "focus:border-slate-400 focus:shadow-[0_0_12px_rgba(0,245,255,0.1)]",
                    errors.password ? "border-red-500/60" : "border-slate-200"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                >
                  <p className="text-xs text-red-600">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2",
                selectedRole.id === "investigator" ? "bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-[0_0_20px_rgba(6,182,212,0.3)]" :
                selectedRole.id === "scientist" ? "bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-[0_0_20px_rgba(245,158,11,0.3)]" :
                "bg-purple-600 hover:bg-purple-500 text-slate-900 shadow-[0_0_20px_rgba(139,92,246,0.3)]",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <><Loader2 size={16} className="animate-spin" /> Authenticating...</>
              ) : (
                <>Access {selectedRole.dashboard} Dashboard</>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/5">
            <div className="flex items-center justify-center gap-2 text-slate-400 text-[10px]">
              <Fingerprint size={14} className="text-violet-600/40" />
              <span>Biometric Auth — Coming Soon</span>
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-gray-700 mt-6">
          &copy; {new Date().getFullYear()} AIVENTRA. Restricted government access.
        </p>
      </motion.div>
    </div>
  );
}
