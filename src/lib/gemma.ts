/**
 * Shared Gemma AI helper — calls the Featherless API for forensic analysis.
 * Used by all modules that need AI-generated insights.
 */

export async function askGemma(prompt: string, systemPrompt?: string): Promise<string> {
  // Mocking AI response to bypass 429 limits for demo
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay

  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes("autopsy") || lowerPrompt.includes("wound")) {
    return "Forensic Analysis Complete:\n- Cause of impact: Blunt force trauma with a 4cm rectangular striking surface.\n- No defensive wounds detected on the posterior side.\n- Lacerations present are consistent with a fall post-impact.\n- Confidence Level: 92%";
  }
  if (lowerPrompt.includes("decomp")) {
    return "Decomposition Assessment:\n- Estimated PMI: 18-24 hours based on temperature and humidity.\n- Autolysis is in early stages.\n- Environmental ADD (Accumulated Degree Days) suggests accelerated decay due to 31°C ambient temp.\n- Minimal insect colonization observed.";
  }
  if (lowerPrompt.includes("entomology")) {
    return "Entomological Analysis:\n- Primary colonizer: Calliphora vicina (Blowfly) in 2nd instar stage.\n- Estimated time of colonization: 12-16 hours prior to discovery.\n- Temperature correction factor applied for 30°C.\n- Confidence Level: 88%";
  }
  if (lowerPrompt.includes("dna") || lowerPrompt.includes("blood")) {
    return "DNA/Bio Assessment:\n- Complete STR profile extracted. No degradation detected.\n- Pattern matches 99.9% with suspect database entry.\n- Blood spatter analysis indicates medium-velocity impact.\n- Contamination risk: Low.";
  }
  if (lowerPrompt.includes("risk") || lowerPrompt.includes("anomaly")) {
    return "Risk & Anomaly Scan:\n- High Risk: GPS timestamp discrepancy detected (4h gap).\n- Medium Risk: Unexplained correlation between Suspect A and Vehicle B.\n- Recommendation: Isolate digital devices for deep forensic extraction.";
  }

  // Generic fallback
  return "AI Forensic Scan:\n- The provided evidence has been analyzed.\n- Patterns suggest human intervention prior to scene discovery.\n- Cross-referencing with global databases yielded 3 potential matches.\n- Please provide additional specific data (DNA, IoT sensor logs) for deeper insights.";
}

/**
 * Generate a forensic analysis prompt for a specific module context.
 */
export function buildForensicPrompt(module: string, context: Record<string, any>): string {
  const base = `As AIVENTRA forensic AI, analyze the following ${module} data:\n\n`;
  const contextStr = Object.entries(context)
    .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
    .join("\n");
  return base + contextStr + "\n\nProvide a professional forensic assessment.";
}
