import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { DataProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "AIVENTRA — Forensic Intelligence System",
  description: "AI-Powered Forensic Triage & Postmortem Intelligence System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full bg-white text-[#F9FAFB] font-sans">
        <AuthProvider><DataProvider>{children}</DataProvider></AuthProvider>
      </body>
    </html>
  );
}
