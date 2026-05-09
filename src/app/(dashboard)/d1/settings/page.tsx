"use client";

import SettingsPanel from "@/components/settings/SettingsPanel";
import { d1Modules } from "@/lib/module-config";

export default function D1SettingsPage() {
  return (
    <SettingsPanel
      dashboard="D1"
      title="Investigation Command Settings"
      subtitle="Configure optional modules for your investigation dashboard."
      modules={d1Modules}
      accentColor="cyan"
    />
  );
}
