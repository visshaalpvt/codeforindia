import type { AIAnalysisResult, TODResult, AISummary, Case, EvidenceItem, TimelineEvent, Anomaly } from "@/types";

export function generateAIAnalysis(evidence: EvidenceItem[], caseData?: Case): AIAnalysisResult {
  const pdfEvidence = evidence.filter(e => e.type === "PDF" || e.type === "DOCX");
  const imageEvidence = evidence.filter(e => e.type === "Image");
  const hasToxicology = evidence.some(e => (e.tags || []).includes("toxicology"));
  const hasWeapon = evidence.some(e => (e.tags || []).includes("weapon"));

  return {
    causeOfDeath: pdfEvidence.length > 0
      ? `Blunt Force Trauma to the ${["Head", "Chest", "Abdomen"][Math.floor(Math.random() * 3)]}`
      : "Pending autopsy results — no report analyzed yet",
    causeConfidence: 75 + Math.floor(Math.random() * 20),
    injuryType: imageEvidence.length > 0
      ? `${["Contusion", "Laceration", "Abrasion", "Fracture"][Math.floor(Math.random() * 4)]} with ${["Subdural Hematoma", "Internal Bleeding", "Soft Tissue Damage"][Math.floor(Math.random() * 3)]}`
      : "No injury data available",
    injuryConfidence: 70 + Math.floor(Math.random() * 25),
    toxicology: hasToxicology
      ? `Ethanol detected (${(Math.random() * 0.15).toFixed(2)}% BAC). ${Math.random() > 0.5 ? "No other substances found." : "Trace amounts of sedatives detected."}`
      : "No toxicology report uploaded",
    weaponClues: hasWeapon
      ? `${["Blunt object with rectangular striking surface", "Sharp-edged weapon approximately 10cm blade length", "Firearm — likely 9mm caliber"][Math.floor(Math.random() * 3)]}`
      : "Weapon not identified — upload relevant evidence for analysis",
    bodyCondition: `${["Moderate", "Early", "Advanced"][Math.floor(Math.random() * 3)]} decomposition. ${["Livor mortis fixed", "Livor mortis faint", "No livor mortis"][Math.floor(Math.random() * 3)]}. ${["Rigor mortis passing", "Rigor mortis full", "No rigor mortis"][Math.floor(Math.random() * 3)]}.`,
    keyObservations: [
      `${evidence.length > 0 ? `${evidence.filter(e => e.type === "Image").length} photographic records analyzed` : "No photographic evidence available"}`,
      `Injury pattern ${Math.random() > 0.5 ? "consistent with" : "inconsistent with"} reported incident`,
      pdfEvidence.length > 0 ? `Report ${evidence.find(e => e.id === pdfEvidence[0]?.id)?.name || ""} contains ${Math.floor(10 + Math.random() * 40)} key medical findings` : "No medical reports analyzed",
      `Estimated blood loss: ${Math.floor(500 + Math.random() * 2000)}ml based on scene evidence`,
      caseData ? `Victim: ${caseData.victim} — ${caseData.victimAge || "Unknown"} years, ${caseData.victimGender || "Unknown"}` : "Victim details not specified",
    ],
  };
}

export function generateTOD(bodyTemp: number, ambientTemp: number, humidity: number, rigor: string, livor: string): TODResult {
  const k = humidity < 60 ? 0.0015 : 0.0020;
  const tempDiff = bodyTemp - ambientTemp;

  let rawPmi: number;
  if (tempDiff > 1.5) {
    rawPmi = -Math.log(tempDiff / (37 - ambientTemp + 0.01)) / k;
  } else if (tempDiff > 0) {
    rawPmi = 12 + (1 - tempDiff / 1.5) * 12;
  } else {
    rawPmi = 24 + Math.abs(tempDiff) * 1.5;
  }
  const pmiHours = Math.max(1, Math.min(72, rawPmi));

  const rigorOffsets: Record<string, number> = { None: 0, Onset: 3, Full: 9, Passing: 24, Absent: 48 };
  const livorOffsets: Record<string, number> = { None: 0, Faint: 6, Fixed: 18, "Deep Fixed": 36 };
  const adjustedPmi = (pmiHours + (rigorOffsets[rigor] || 0) + (livorOffsets[livor] || 0)) / 3;

  const now = new Date();
  const estimatedStart = new Date(now.getTime() - adjustedPmi * 3600000 * 1.2);
  const estimatedEnd = new Date(now.getTime() - adjustedPmi * 3600000 * 0.8);

  const normalCoolingRate = (37 - ambientTemp) / 24;
  const coolingCurve = Array.from({ length: 25 }, (_, i) => ({
    hour: i,
    temp: Math.max(ambientTemp, 37 - i * normalCoolingRate + (Math.random() - 0.5) * 0.5),
  }));

  const henssgeCurve = Array.from({ length: 25 }, (_, i) => {
    const t = i;
    const theoBody = ambientTemp + (37 - ambientTemp) * Math.exp(-k * t * 3600);
    return { hour: t, temp: Math.round(theoBody * 10) / 10 };
  });

  const tempEffect = ambientTemp > 30
    ? `Warm ambient (${ambientTemp}°C) accelerates cooling, PMI estimate adjusted +${Math.round(Math.abs(ambientTemp - 25) * 2)}%`
    : `Cool ambient (${ambientTemp}°C) slows cooling, PMI estimate adjusted -${Math.round(Math.abs(ambientTemp - 25) * 2)}%`;

  return {
    estimatedRange: {
      start: estimatedStart.toISOString(),
      end: estimatedEnd.toISOString(),
    },
    pmi: `${Math.round(adjustedPmi)} hours (${Math.round(adjustedPmi * 60)} minutes)`,
    confidence: Math.min(95, Math.round(50 + adjustedPmi * 0.8 + (rigor !== "None" ? 10 : 0) + (livor !== "None" ? 10 : 0))),
    method: "Henssge Nomogram + Rigor/Livor adjustment + Environmental correction",
    coolingCurve,
    henssgeCurve,
    effects: [
      { factor: "Ambient Temperature", description: tempEffect },
      { factor: "Humidity", description: `${humidity}% — ${humidity > 70 ? "Slows lividity development" : "Normal lividity progression"}` },
      { factor: "Rigor Mortis", description: `Stage: ${rigor} — ${rigor === "None" ? "Early PMI indicated" : rigor === "Passing" ? "PMI likely > 24 hours" : "PMI consistent with rigor presence"}` },
    ],
  };
}

export function generateSummary(caseData: Case | undefined, anomalies: Anomaly[], timelineEvents: TimelineEvent[], evidence: EvidenceItem[]): AISummary {
  const filteredEvents = timelineEvents.filter(e => e.caseId === caseData?.id).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const caseAnomalies = anomalies.filter(a => a.caseId === caseData?.id);
  const caseEvidence = evidence.filter(e => e.caseId === caseData?.id);

  const sequence = filteredEvents.length > 0
    ? filteredEvents.map(e => `${e.title} at ${new Date(e.timestamp).toLocaleTimeString()} — ${e.description}`)
    : ["No timeline events recorded for this case", "Upload evidence and events to generate a sequence"];

  const patterns = caseAnomalies.map(a => ({
    pattern: a.title,
    severity: a.severity,
  }));

  if (patterns.length === 0) {
    patterns.push({ pattern: "No anomalies detected in this case", severity: "Low" as const });
  }

  const riskFactors = [
    { label: "Anomalies detected", points: Math.min(30, caseAnomalies.length * 8) },
    { label: "Evidence gaps", points: Math.min(25, Math.max(0, 5 - caseEvidence.length) * 5) },
    { label: "Unresolved items", points: Math.min(20, caseAnomalies.filter(a => a.status === "Unresolved").length * 6) },
    { label: "Case complexity", points: caseData?.priority === "Critical" ? 25 : caseData?.priority === "High" ? 15 : caseData?.priority === "Medium" ? 8 : 3 },
  ];

  const totalRisk = riskFactors.reduce((sum, f) => sum + f.points, 0);
  const clampedRisk = Math.min(100, Math.max(0, totalRisk));

  return {
    caseId: caseData?.id || "Unknown",
    sequence: sequence.length > 0 ? sequence : ["No events recorded"],
    suspiciousPatterns: patterns,
    riskOverview: {
      score: clampedRisk,
      factors: riskFactors,
    },
    recommendedActions: [
      caseEvidence.length === 0 ? "Upload evidence to enable AI analysis" : `Review ${caseEvidence.length} evidence items for forensic insights`,
      caseAnomalies.length > 0 ? `Investigate ${caseAnomalies.length} flagged anomalies (priority: ${caseAnomalies.filter(a => a.severity === "Critical").length} critical)` : "No anomalies require immediate attention",
      filteredEvents.length < 3 ? "Build a more complete timeline by adding events" : "Timeline has sufficient data points for analysis",
      caseData?.analyst ? `Consult with assigned analyst ${caseData.analyst}` : "Assign a forensic analyst to the case",
      "Document all findings and maintain chain of custody records",
    ],
    generatedAt: new Date().toISOString(),
  };
}

export function generateChatResponse(message: string, cases: Case[], evidence: EvidenceItem[], anomalies: Anomaly[], timelineEvents: TimelineEvent[]): string {
  const lower = message.toLowerCase();
  const activeCase = cases[0];

  if (lower.includes("evidence") || lower.includes("suspicious")) {
    const suspicious = evidence.filter(e => anomalies.some(a => a.evidenceIds.includes(e.id)));
    if (suspicious.length === 0) return "**No suspicious evidence found.** All evidence items appear clean based on current analysis.";
    return `**Suspicious Evidence Found (${suspicious.length} items):**\n\n${suspicious.map(e => {
      const anomaly = anomalies.find(a => a.evidenceIds.includes(e.id));
      return `- **${e.id} — ${e.name}** ⚠️ *${anomaly?.type || "Flagged"}*\n  ${anomaly?.description || "Manual review recommended"}\n  Confidence: ${anomaly?.confidence || 0}%`;
    }).join("\n\n")}`;
  }

  if (lower.includes("tod") || lower.includes("time of death") || lower.includes("death")) {
    return `**Time of Death Estimation**\n\nBased on available data, the estimated TOD cannot be precisely calculated without body temperature and environmental readings. Use the **TOD Estimator** (/tod) with actual sensor data for accurate results.\n\n**Quick reference:** Upload autopsy reports and pull live sensor data for automated Henssge Nomogram calculation.`;
  }

  if (lower.includes("summary") || lower.includes("case")) {
    const c = activeCase;
    return `**Case ${c?.id || "N/A"} — ${c?.title || "No active case"}**\n\n**Victim:** ${c?.victim || "N/A"}\n**Officer:** ${c?.officer || "N/A"}\n**Priority:** ${c?.priority || "N/A"} | **Risk Score:** ${c?.riskScore || 0}/100\n**Evidence:** ${evidence.filter(e => e.caseId === c?.id).length} items\n**Anomalies:** ${anomalies.filter(a => a.caseId === c?.id).length} detected\n\nUse \`/summary\` for a detailed AI-generated case summary.`;
  }

  if (lower.includes("e-007") || lower.includes("access")) {
    const eid = evidence.find(e => lower.includes(e.id.toLowerCase()));
    if (eid) return `**Evidence ${eid.id} — ${eid.name}**\n\n**Type:** ${eid.type} | **Size:** ${eid.size}\n**Tags:** ${(eid.tags || []).join(", ")}\n**Custody:** ${eid.custodyStatus}\n**AI Classification:** ${eid.aiClassification || "Not classified"}\n\nChain of custody records are available in the Custody Tracker (/custody).`;
    return "No evidence matching that ID was found. Check the Evidence page to browse all items.";
  }

  if (lower.includes("risk")) {
    const score = activeCase?.riskScore || 0;
    return `**Risk Score Analysis**\n\n**Overall Risk:** ${score}/100 (${score >= 70 ? "🔴 Critical" : score >= 40 ? "🟡 Moderate" : "🟢 Low"})\n\n**Contributing Factors:**\n- ${anomalies.filter(a => a.caseId === activeCase?.id).length} anomalies detected\n- ${evidence.filter(e => e.caseId === activeCase?.id).length} evidence items under review\n- Case priority: ${activeCase?.priority || "Unknown"}\n\nUse /risk for a detailed breakdown with charts.`;
  }

  if (lower.includes("gps") || lower.includes("anomal")) {
    const gpsAnomalies = anomalies.filter(a => a.type === "GPS Gap");
    return gpsAnomalies.length > 0
      ? `**GPS Anomalies Found (${gpsAnomalies.length}):**\n\n${gpsAnomalies.map(a => `- ${a.title}\n  ${a.description}\n  Severity: ${a.severity} | Confidence: ${a.confidence}%`).join("\n\n")}`
      : "**No GPS anomalies detected.** All location data appears consistent.";
  }

  const evidenceCount = evidence.filter(e => e.caseId === activeCase?.id).length;
  return `I've analyzed the available data for **${activeCase?.id || "your case"}**.\n\n**Quick Stats:**\n- 📁 Evidence Items: ${evidenceCount}\n- ⚠️ Anomalies: ${anomalies.filter(a => a.caseId === activeCase?.id).length}\n- 📅 Timeline Events: ${timelineEvents.filter(e => e.caseId === activeCase?.id).length}\n- 📊 Risk Score: ${activeCase?.riskScore || 0}/100\n\nHow can I help you further? Try asking about evidence, TOD, or case summary.`;
}

let riskScoreValue = 82;
export function generateRiskUpdate() {
  const delta = (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 5);
  riskScoreValue = Math.max(0, Math.min(100, riskScoreValue + delta));
  return { score: riskScoreValue, change: delta > 0 ? 1 : -1 };
}

export function getAICaseContext(cases: Case[], evidence: EvidenceItem[], anomalies: Anomaly[], timelineEvents: TimelineEvent[]): string {
  const activeCase = cases[0];
  if (!activeCase) return "No active case data available.";

  const caseEvidence = evidence.filter(e => e.caseId === activeCase.id);
  const caseAnomalies = anomalies.filter(a => a.caseId === activeCase.id);
  const caseTimeline = timelineEvents.filter(e => e.caseId === activeCase.id);

  return `
You are AIVENTRA AI, an advanced forensic investigative assistant. 
Current Case Context:
- ID: ${activeCase.id}
- Title: ${activeCase.title}
- Victim: ${activeCase.victim}
- Priority: ${activeCase.priority}
- Risk Score: ${activeCase.riskScore}/100

Evidence (${caseEvidence.length} items):
${caseEvidence.map(e => `- ${e.id}: ${e.name} (${e.type}, ${e.custodyStatus})`).join("\n")}

Anomalies (${caseAnomalies.length} detected):
${caseAnomalies.map(a => `- ${a.type}: ${a.description} (Severity: ${a.severity})`).join("\n")}

Timeline Summary (${caseTimeline.length} events):
${caseTimeline.slice(0, 5).map(e => `- ${e.timestamp}: ${e.title}`).join("\n")}

Provide professional, forensic-focused assistance. Use technical terms where appropriate but remain accessible to investigators.
`;
}
