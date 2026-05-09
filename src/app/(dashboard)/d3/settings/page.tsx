"use client";

import SettingsPanel from "@/components/settings/SettingsPanel";
import { d3Modules } from "@/lib/module-config";

export default function D3SettingsPage() {
  return (
    <SettingsPanel
      dashboard="D3"
      title="Intelligence Analytics Settings"
      subtitle="Configure optional modules for your intelligence workspace."
      modules={d3Modules}
      accentColor="purple"
    />
  );
}
