import type {
  Case, EvidenceItem, TimelineEvent, SensorDevice, Anomaly,
  CustodyRecord, Notification, CorrelationNode, CorrelationEdge,
  AIAnalysisResult, TODResult, AISummary, ChatMessage,
} from "@/types";

// All data starts empty — only user-added data is shown
export const mockCases: Case[] = [];
export const mockEvidence: EvidenceItem[] = [];
export const mockTimelineEvents: TimelineEvent[] = [];

// IoT sensors are live hardware feeds — always active
export const mockSensors: SensorDevice[] = [
  { id: "S-001", name: "Temperature Sensor", type: "DHT22", value: 31.4, unit: "°C", status: "Online", lastUpdated: new Date().toISOString(), history: Array.from({ length: 60 }, (_, i) => ({ value: 30 + Math.sin(i * 0.1) * 2 + Math.random() * 0.5, timestamp: new Date(Date.now() - (60 - i) * 3000).toISOString() })) },
  { id: "S-002", name: "Humidity Sensor", type: "DHT22", value: 72, unit: "%", status: "Online", lastUpdated: new Date().toISOString(), history: Array.from({ length: 60 }, (_, i) => ({ value: 70 + Math.sin(i * 0.05) * 5 + Math.random() * 1, timestamp: new Date(Date.now() - (60 - i) * 3000).toISOString() })) },
  { id: "S-003", name: "Air Quality Monitor", type: "MQ-135", value: 145, unit: "AQI", status: "Threshold", lastUpdated: new Date().toISOString(), history: Array.from({ length: 60 }, (_, i) => ({ value: 120 + Math.sin(i * 0.08) * 30 + Math.random() * 5, timestamp: new Date(Date.now() - (60 - i) * 3000).toISOString() })) },
  { id: "S-005", name: "Live Camera Feed", type: "Camera", value: "LIVE", status: "Online", lastUpdated: new Date().toISOString(), history: [] },
  { id: "S-006", name: "GPS Tracker", type: "GPS", value: "13.0827°N, 80.2707°E", status: "Online", lastUpdated: new Date().toISOString(), history: Array.from({ length: 60 }, (_, i) => ({ value: 13.0827 + Math.sin(i * 0.02) * 0.001, timestamp: new Date(Date.now() - (60 - i) * 3000).toISOString() })) },
];

export const mockAnomalies: Anomaly[] = [];
export const mockCustodyRecords: CustodyRecord[] = [];
export const mockNotifications: Notification[] = [];
export const mockCorrelationNodes: CorrelationNode[] = [];
export const mockCorrelationEdges: CorrelationEdge[] = [];

export const mockChatMessages: ChatMessage[] = [
  { id: "CM-001", role: "assistant", content: "Welcome to AIVENTRA AI Assistant. I can help you analyze evidence, generate summaries, and answer questions about your cases. Start by creating a case in the Investigation dashboard.", timestamp: new Date().toISOString() },
];

export function generateMockSensorReading() {
  return {
    temperature: 30 + Math.random() * 3,
    humidity: 68 + Math.random() * 8,
    motion: Math.random() > 0.85,
    gps: { lat: 13.0827 + Math.random() * 0.001, lng: 80.2707 + Math.random() * 0.001 },
    aqi: 120 + Math.random() * 50,
    vibration: Math.random() > 0.9,
    timestamp: new Date().toISOString(),
  };
}
