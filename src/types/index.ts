export type Priority = "Low" | "Medium" | "High" | "Critical";
export type Status = "Active" | "Pending" | "Closed" | "Archived";
export type CaseType = "Homicide" | "Accident" | "Missing Person" | "Cybercrime" | "Other";
export type EvidenceType = "PDF" | "DOCX" | "Image" | "Video" | "CSV" | "GPS";
export type Role = "Investigator" | "Forensic Analyst" | "Medical Officer" | "Admin";
export type SensorStatus = "Online" | "Offline" | "Alert" | "Threshold";
export type AnomalySeverity = "Critical" | "High" | "Medium" | "Low";
export type AnomalyType =
  | "Timestamp Mismatch"
  | "Metadata Conflict"
  | "GPS Gap"
  | "Contradictory Statements"
  | "Unusual Movement Pattern"
  | "Missing Evidence Chain"
  | "Comm Blackout";
export type CustodyStatus = "Secured" | "In Lab" | "In Transit" | "Compromised";
export type NotificationType = "alert" | "sensor" | "evidence" | "system" | "resolved";
export type RigorStage = "None" | "Onset" | "Full" | "Passing" | "Absent";
export type LivorStage = "None" | "Faint" | "Fixed" | "Deep Fixed";

export interface Case {
  id: string;
  title: string;
  victim: string;
  victimAge?: number;
  victimGender?: string;
  officer: string;
  analyst?: string;
  medicalOfficer?: string;
  type: CaseType;
  priority: Priority;
  riskScore: number;
  status: Status;
  createdAt: string;
  location?: string;
  evidenceCount: number;
  anomalies: number;
  notes?: string;
}

export interface EvidenceItem {
  id: string;
  caseId: string;
  name: string;
  type: EvidenceType;
  size: string;
  uploadedAt: string;
  tags: string[];
  aiClassification?: string;
  custodyStatus: CustodyStatus;
  thumbnail?: string;
  fileUrl?: string;
}

export interface TimelineEvent {
  id: string;
  caseId: string;
  timestamp: string;
  type: "CCTV" | "Motion" | "GPS" | "Call Log" | "AI Alert" | "Evidence Upload" | "Sensor Trigger";
  title: string;
  description: string;
  confidence: number;
  evidenceId?: string;
  location?: { lat: number; lng: number };
}

export interface SensorReading {
  id: string;
  temperature: number;
  humidity: number;
  motion: boolean;
  gps: { lat: number; lng: number };
  aqi: number;
  vibration: boolean;
  timestamp: string;
}

export interface SensorDevice {
  id: string;
  name: string;
  type: "DHT22" | "PIR" | "MQ-135" | "Vibration" | "GPS" | "Camera";
  value: number | string | boolean;
  unit?: string;
  status: SensorStatus;
  lastUpdated: string;
  history: { value: number; timestamp: string }[];
}

export interface Anomaly {
  id: string;
  caseId: string;
  severity: AnomalySeverity;
  type: AnomalyType;
  title: string;
  description: string;
  aiExplanation: string;
  evidenceIds: string[];
  detectedAt: string;
  status: "Unresolved" | "Under Investigation" | "Confirmed" | "False Positive" | "Escalated";
  confidence: number;
}

export interface CustodyRecord {
  id: string;
  evidenceId: string;
  action: string;
  person: string;
  role: Role;
  timestamp: string;
  location: string;
  verified: boolean;
  signature?: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  severity?: "critical" | "warning" | "info";
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  actionable?: boolean;
  actionLabel?: string;
  actionLink?: string;
}

export interface CorrelationNode {
  id: string;
  type: "victim" | "suspect" | "device" | "cctv" | "gps" | "evidence" | "location";
  label: string;
  data: Record<string, unknown>;
}

export interface CorrelationEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  confidence: number;
  confirmed: boolean;
  suspicious: boolean;
}

export interface AIAnalysisResult {
  causeOfDeath: string;
  causeConfidence: number;
  injuryType: string;
  injuryConfidence: number;
  toxicology: string;
  weaponClues: string;
  bodyCondition: string;
  keyObservations: string[];
}

export interface TODResult {
  estimatedRange: { start: string; end: string };
  pmi: string;
  confidence: number;
  method: string;
  coolingCurve: { hour: number; temp: number }[];
  henssgeCurve: { hour: number; temp: number }[];
  effects: { factor: string; description: string }[];
}

export interface AISummary {
  caseId: string;
  sequence: string[];
  suspiciousPatterns: { pattern: string; severity: AnomalySeverity }[];
  riskOverview: { score: number; factors: { label: string; points: number }[] };
  recommendedActions: string[];
  generatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
