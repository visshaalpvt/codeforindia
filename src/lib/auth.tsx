"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "./firebase";
import { signInWithPopup } from "firebase/auth";

interface User {
  name: string;
  email: string;
  role: "Investigator" | "Lab Scientist" | "Intelligence Analyst" | "Admin";
  badgeId: string;
  dashboard: "D1" | "D2" | "D3";
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  register: (data: { name: string; email: string; password: string; role: string; badgeId: string }) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => void;
}

const CREDENTIALS: Record<string, { password: string; user: User }> = {
  "investigator@aiventra.gov": {
    password: "invest@123",
    user: {
      name: "Det. Arjun Mehta",
      email: "investigator@aiventra.gov",
      role: "Investigator",
      badgeId: "INV-401",
      dashboard: "D1",
    },
  },
  "scientist@aiventra.gov": {
    password: "labsci@123",
    user: {
      name: "Dr. Priya Sharma",
      email: "scientist@aiventra.gov",
      role: "Lab Scientist",
      badgeId: "LAB-208",
      dashboard: "D2",
    },
  },
  "analyst@aiventra.gov": {
    password: "intel@123",
    user: {
      name: "Visshaalramachand...",
      email: "analyst@aiventra.gov",
      role: "Intelligence Analyst",
      badgeId: "INT-115",
      dashboard: "D3",
    },
  },
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Persist auth across refreshes
  useEffect(() => {
    const saved = localStorage.getItem("aiventra_user");
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch {}
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    await new Promise(r => setTimeout(r, 600));
    const cred = CREDENTIALS[email.toLowerCase()];
    if (!cred) return { success: false, error: "Unknown email. Use investigator@, scientist@, or analyst@aiventra.gov" };
    if (cred.password !== password) return { success: false, error: "Incorrect password" };
    setUser(cred.user);
    localStorage.setItem("aiventra_user", JSON.stringify(cred.user));
    return { success: true };
  }, []);

  const loginWithGoogle = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;
      
      // Map Google user to AIVENTRA user type
      const u: User = {
        name: googleUser.displayName || "Google User",
        email: googleUser.email || "",
        role: "Investigator", // Default role
        badgeId: `G-${googleUser.uid.slice(0, 5).toUpperCase()}`,
        dashboard: "D1",
      };

      setUser(u);
      localStorage.setItem("aiventra_user", JSON.stringify(u));
      return { success: true };
    } catch (error: any) {
      console.error("Google Login Error:", error);
      return { success: false, error: error.message || "Google sign-in failed" };
    }
  }, []);

  const register = useCallback(async (data: { name: string; email: string; password: string; role: string; badgeId: string }) => {
    await new Promise(r => setTimeout(r, 800));
    const u: User = {
      name: data.name,
      email: data.email,
      role: data.role as User["role"],
      badgeId: data.badgeId,
      dashboard: data.role === "Lab Scientist" ? "D2" : data.role === "Intelligence Analyst" ? "D3" : "D1",
    };
    setUser(u);
    localStorage.setItem("aiventra_user", JSON.stringify(u));
  }, []);

  const forgotPassword = useCallback(async (_email: string) => {
    await new Promise(r => setTimeout(r, 1000));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("aiventra_user");
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, loginWithGoogle, register, forgotPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
