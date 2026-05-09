"use client";

import SettingsPanel from "@/components/settings/SettingsPanel";
import { d2Modules } from "@/lib/module-config";

export default function D2SettingsPage() {
  return (
    <SettingsPanel
      dashboard="D2"
      title="Forensic Science Lab Settings"
      subtitle="Configure optional modules for your forensic laboratory."
      modules={d2Modules}
      accentColor="amber"
    />
  );
}
