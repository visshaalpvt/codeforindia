"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Shield, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

const roles = ["Investigator", "Forensic Analyst", "Medical Officer", "Admin"] as const;

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
    role: z.enum(roles, "Select a role"),
    badgeId: z.string().min(3, "Badge/Employee ID is required"),
    acceptTerms: z.literal(true, "You must accept the terms"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

const roleAccents: Record<string, string> = {
  Investigator: "border-slate-400 text-violet-600 focus:border-cyan-500",
  "Forensic Analyst": "border-blue-500/50 text-blue-600 focus:border-blue-500",
  "Medical Officer": "border-emerald-500/50 text-emerald-400 focus:border-emerald-500",
  Admin: "border-red-500/50 text-red-600 focus:border-red-500",
};

export default function RegisterPage() {
  const router = useRouter();
  const { register: authRegister } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: undefined,
      badgeId: "",
      acceptTerms: false as unknown as true,
    },
  });

  const selectedRole = watch("role");
  const accentClass = selectedRole ? roleAccents[selectedRole] : "border-slate-400 text-violet-600";

  async function onSubmit(data: RegisterForm) {
    setIsLoading(true);
    await authRegister({
      name: data.fullName,
      email: data.email,
      password: data.password,
      role: data.role,
      badgeId: data.badgeId,
    });
    setIsLoading(false);
    setSuccess(true);
    setTimeout(() => router.push("/login"), 1200);
  }

  if (success) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
        <div className="animate-grid-bg absolute inset-0" />
        <div className="scanline absolute inset-0 pointer-events-none z-10" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-20 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          >
            <CheckCircle2 size={64} className="text-emerald-400 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-xl font-semibold text-slate-900">Account Created</h2>
          <p className="text-slate-500 mt-1">Redirecting to login...</p>
        </motion.div>
      </div>
    );
  }

  const loading = isSubmitting || isLoading;

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white py-12">
      <div className="animate-grid-bg absolute inset-0" />
      <div className="scanline absolute inset-0 pointer-events-none z-10" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-20 w-full max-w-md px-4"
      >
        <div className="backdrop-blur-md bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl p-8 shadow-[0_0_40px_rgba(0,245,255,0.08)]">
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <Shield className="w-10 h-10 text-violet-600" />
              <div className="absolute inset-0 blur-xl bg-violet-200 rounded-full" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 font-[family-name:var(--font-sans)] tracking-tight">
              Create Account
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Register for AIVENTRA access
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                {...register("fullName")}
                placeholder="Dr. Alex Cross"
                className={cn(
                  "w-full px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border text-slate-900 placeholder-gray-500 outline-none transition-all duration-200",
                  "focus:border-slate-400 focus:shadow-[0_0_12px_rgba(0,245,255,0.15)]",
                  errors.fullName
                    ? "border-red-500/60 shadow-[0_0_12px_rgba(239,68,68,0.25)]"
                    : "border-slate-200"
                )}
              />
              {errors.fullName && (
                <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="a.cross@agency.gov"
                className={cn(
                  "w-full px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border text-slate-900 placeholder-gray-500 outline-none transition-all duration-200",
                  "focus:border-slate-400 focus:shadow-[0_0_12px_rgba(0,245,255,0.15)]",
                  errors.email
                    ? "border-red-500/60 shadow-[0_0_12px_rgba(239,68,68,0.25)]"
                    : "border-slate-200"
                )}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;"
                    className={cn(
                      "w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-50 hover:bg-slate-100 border text-slate-900 placeholder-gray-500 outline-none transition-all duration-200",
                      "focus:border-slate-400 focus:shadow-[0_0_12px_rgba(0,245,255,0.15)]",
                      errors.password
                        ? "border-red-500/60 shadow-[0_0_12px_rgba(239,68,68,0.25)]"
                        : "border-slate-200"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Confirm
                </label>
                <div className="relative">
                  <input
                    {...register("confirmPassword")}
                    type={showConfirm ? "text" : "password"}
                    placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;"
                    className={cn(
                      "w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-50 hover:bg-slate-100 border text-slate-900 placeholder-gray-500 outline-none transition-all duration-200",
                      "focus:border-slate-400 focus:shadow-[0_0_12px_rgba(0,245,255,0.15)]",
                      errors.confirmPassword
                        ? "border-red-500/60 shadow-[0_0_12px_rgba(239,68,68,0.25)]"
                        : "border-slate-200"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Role
                </label>
                <select
                  {...register("role")}
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border text-slate-900 outline-none transition-all duration-200 appearance-none cursor-pointer",
                    "focus:shadow-[0_0_12px_rgba(0,245,255,0.15)]",
                    selectedRole
                      ? accentClass
                      : "border-slate-200 text-slate-500 focus:border-slate-400",
                    errors.role &&
                      "border-red-500/60 shadow-[0_0_12px_rgba(239,68,68,0.25)]"
                  )}
                >
                  <option value="" className="bg-white">
                    Select role
                  </option>
                  {roles.map((r) => (
                    <option key={r} value={r} className="bg-white">
                      {r}
                    </option>
                  ))}
                </select>
                {errors.role && (
                  <p className="mt-1 text-xs text-red-600">{errors.role.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Badge / Employee ID
                </label>
                <input
                  {...register("badgeId")}
                  placeholder="AG-4421"
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border text-slate-900 placeholder-gray-500 outline-none transition-all duration-200",
                    "focus:border-slate-400 focus:shadow-[0_0_12px_rgba(0,245,255,0.15)]",
                    errors.badgeId
                      ? "border-red-500/60 shadow-[0_0_12px_rgba(239,68,68,0.25)]"
                      : "border-slate-200"
                  )}
                />
                {errors.badgeId && (
                  <p className="mt-1 text-xs text-red-600">{errors.badgeId.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  {...register("acceptTerms")}
                  type="checkbox"
                  className="w-4 h-4 mt-0.5 rounded border-slate-300 bg-slate-50 hover:bg-slate-100 accent-cyan-400"
                />
                <span className="text-sm text-slate-500">
                  I agree to the{" "}
                  <span className="text-violet-600 hover:text-violet-700">Terms of Service</span> and{" "}
                  <span className="text-violet-600 hover:text-violet-700">Privacy Policy</span>
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="mt-1 text-xs text-red-600">{errors.acceptTerms.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2",
                "bg-violet-100 border border-slate-400 text-violet-600 hover:bg-violet-200",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating account...
                </>
              ) : (
                "Register"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-violet-600 hover:text-violet-700 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          &copy; {new Date().getFullYear()} AIVENTRA. Restricted access.
        </p>
      </motion.div>
    </div>
  );
}
