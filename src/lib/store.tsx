"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type {
  Case, EvidenceItem, TimelineEvent, SensorDevice, Anomaly,
  CustodyRecord, Notification, CorrelationNode, CorrelationEdge,
  ChatMessage,
} from "@/types";
import { mockSensors, mockChatMessages } from "./mock-data";
import { getDefaultEnabledModules } from "./module-config";
import { database } from "./firebase";
import { ref, onValue, set, update, remove } from "firebase/database";

interface DataState {
  cases: Case[];
  evidence: EvidenceItem[];
  timelineEvents: TimelineEvent[];
  sensors: SensorDevice[];
  anomalies: Anomaly[];
  custodyRecords: CustodyRecord[];
  notifications: Notification[];
  chatMessages: ChatMessage[];
  correlationNodes: CorrelationNode[];
  correlationEdges: CorrelationEdge[];
  activeDashboard: "D1" | "D2" | "D3";
  enabledModules: Record<string, boolean>;
}

interface DataContextValue extends DataState {
  dispatch: any;
  addCase: (data: Omit<Case, "id" | "createdAt">) => string;
  updateCase: (id: string, data: Partial<Case>) => void;
  deleteCase: (id: string) => void;
  addEvidence: (data: Omit<EvidenceItem, "id" | "uploadedAt">) => void;
  updateEvidence: (id: string, data: Partial<EvidenceItem>) => void;
  deleteEvidence: (id: string) => void;
  addTimelineEvent: (data: Omit<TimelineEvent, "id">) => void;
  updateTimelineEvent: (id: string, data: Partial<TimelineEvent>) => void;
  deleteTimelineEvent: (id: string) => void;
  updateSensor: (id: string, data: Partial<SensorDevice>) => void;
  addAnomaly: (data: Omit<Anomaly, "id" | "detectedAt">) => void;
  updateAnomaly: (id: string, data: Partial<Anomaly>) => void;
  deleteAnomaly: (id: string) => void;
  addCustodyRecord: (data: Omit<CustodyRecord, "id">) => void;
  addNotification: (data: Omit<Notification, "id">) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  addChatMessage: (data: Omit<ChatMessage, "id" | "timestamp">) => void;
  addCorrelationNode: (data: Omit<CorrelationNode, "id">) => void;
  addCorrelationEdge: (data: Omit<CorrelationEdge, "id">) => void;
  deleteCorrelationEdge: (id: string) => void;
  updateCorrelationEdge: (id: string, data: Partial<CorrelationEdge>) => void;
  toggleModule: (key: string) => void;
  setModuleEnabled: (key: string, enabled: boolean) => void;
  isModuleEnabled: (key: string) => boolean;
  setDashboard: (id: "D1" | "D2" | "D3") => void;
}

const DataContext = createContext<DataContextValue | null>(null);

function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataState>({
    cases: [],
    evidence: [],
    timelineEvents: [],
    sensors: mockSensors,
    anomalies: [],
    custodyRecords: [],
    notifications: [],
    chatMessages: mockChatMessages,
    correlationNodes: [],
    correlationEdges: [],
    activeDashboard: "D1",
    enabledModules: getDefaultEnabledModules(),
  });

  useEffect(() => {
    const unsubscribes = ["cases", "evidence", "timelineEvents", "anomalies", "custodyRecords", "notifications", "chatMessages", "correlationNodes", "correlationEdges"].map(node => {
      const nodeRef = ref(database, node);
      return onValue(nodeRef, (snapshot) => {
        const val = snapshot.val();
        if (val) {
          const arr = Object.values(val) as any[];
          if (arr.length > 0 && arr[0].createdAt) arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          else if (arr.length > 0 && arr[0].timestamp) arr.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          else if (arr.length > 0 && arr[0].detectedAt) arr.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
          else if (arr.length > 0 && arr[0].uploadedAt) arr.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
          setState(prev => ({ ...prev, [node]: arr }));
        } else {
          setState(prev => ({ ...prev, [node]: node === "chatMessages" ? mockChatMessages : [] }));
        }
      });
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  const fbSet = (path: string, item: any) => set(ref(database, path), item);
  const fbUpdate = (path: string, data: any) => update(ref(database, path), data);
  const fbRemove = (path: string) => remove(ref(database, path));

  const addCase = useCallback((data: Omit<Case, "id" | "createdAt">) => {
    const newCase: Case = { ...data, id: genId("CI"), createdAt: new Date().toISOString() };
    fbSet(`cases/${newCase.id}`, newCase);
    const tlId = genId("TL");
    fbSet(`timelineEvents/${tlId}`, { id: tlId, caseId: newCase.id, timestamp: new Date().toISOString(), type: "Evidence Upload", title: `Case created: ${newCase.title}`, description: `New case opened by ${newCase.officer}`, confidence: 100 });
    const nId = genId("N");
    fbSet(`notifications/${nId}`, { id: nId, type: "system", title: "New Case Created", description: `Case ${newCase.id} — ${newCase.title}`, timestamp: new Date().toISOString(), read: false });
    return newCase.id;
  }, []);

  const updateCase = useCallback((id: string, data: Partial<Case>) => fbUpdate(`cases/${id}`, data), []);
  const deleteCase = useCallback((id: string) => fbRemove(`cases/${id}`), []);

  const addEvidence = useCallback((data: Omit<EvidenceItem, "id" | "uploadedAt">) => {
    const newItem: EvidenceItem = { ...data, id: genId("E"), uploadedAt: new Date().toISOString() };
    fbSet(`evidence/${newItem.id}`, newItem);
    const tlId = genId("TL");
    fbSet(`timelineEvents/${tlId}`, { id: tlId, caseId: data.caseId, timestamp: new Date().toISOString(), type: "Evidence Upload", title: `Evidence uploaded: ${data.name}`, description: `Type: ${data.type}`, confidence: 100 });
    const nId = genId("N");
    fbSet(`notifications/${nId}`, { id: nId, type: "evidence", title: "New Evidence Uploaded", description: `${data.name} added to case ${data.caseId}`, timestamp: new Date().toISOString(), read: false });
  }, []);

  const updateEvidence = useCallback((id: string, data: Partial<EvidenceItem>) => fbUpdate(`evidence/${id}`, data), []);
  const deleteEvidence = useCallback((id: string) => fbRemove(`evidence/${id}`), []);

  const addTimelineEvent = useCallback((data: Omit<TimelineEvent, "id">) => {
    const id = genId("TL");
    fbSet(`timelineEvents/${id}`, { ...data, id });
  }, []);

  const updateTimelineEvent = useCallback((id: string, data: Partial<TimelineEvent>) => fbUpdate(`timelineEvents/${id}`, data), []);
  const deleteTimelineEvent = useCallback((id: string) => fbRemove(`timelineEvents/${id}`), []);

  const updateSensor = useCallback((id: string, data: Partial<SensorDevice>) => {
    setState(prev => ({ ...prev, sensors: prev.sensors.map(s => s.id === id ? { ...s, ...data } : s) }));
  }, []);

  const addAnomaly = useCallback((data: Omit<Anomaly, "id" | "detectedAt">) => {
    const newAnomaly: Anomaly = { ...data, id: genId("A"), detectedAt: new Date().toISOString() };
    fbSet(`anomalies/${newAnomaly.id}`, newAnomaly);
    const nId = genId("N");
    fbSet(`notifications/${nId}`, { id: nId, type: "alert", severity: data.severity === "Critical" ? "critical" : "warning", title: `New Anomaly: ${data.type}`, description: data.title, timestamp: new Date().toISOString(), read: false });
  }, []);

  const updateAnomaly = useCallback((id: string, data: Partial<Anomaly>) => fbUpdate(`anomalies/${id}`, data), []);
  const deleteAnomaly = useCallback((id: string) => fbRemove(`anomalies/${id}`), []);

  const addCustodyRecord = useCallback((data: Omit<CustodyRecord, "id">) => {
    const id = genId("CR");
    fbSet(`custodyRecords/${id}`, { ...data, id });
  }, []);

  const addNotification = useCallback((data: Omit<Notification, "id">) => {
    const id = genId("N");
    fbSet(`notifications/${id}`, { ...data, id });
  }, []);

  const markNotificationRead = useCallback((id: string) => fbUpdate(`notifications/${id}`, { read: true }), []);
  const markAllNotificationsRead = useCallback(() => {
    state.notifications.forEach(n => fbUpdate(`notifications/${n.id}`, { read: true }));
  }, [state.notifications]);
  const deleteNotification = useCallback((id: string) => fbRemove(`notifications/${id}`), []);

  const addChatMessage = useCallback((data: Omit<ChatMessage, "id" | "timestamp">) => {
    const id = genId("CM");
    fbSet(`chatMessages/${id}`, { ...data, id, timestamp: new Date().toISOString() });
  }, []);

  const addCorrelationNode = useCallback((data: Omit<CorrelationNode, "id">) => {
    const id = genId("NODE");
    fbSet(`correlationNodes/${id}`, { ...data, id });
  }, []);

  const addCorrelationEdge = useCallback((data: Omit<CorrelationEdge, "id">) => {
    const id = genId("EDGE");
    fbSet(`correlationEdges/${id}`, { ...data, id });
  }, []);

  const deleteCorrelationEdge = useCallback((id: string) => fbRemove(`correlationEdges/${id}`), []);
  const updateCorrelationEdge = useCallback((id: string, data: Partial<CorrelationEdge>) => fbUpdate(`correlationEdges/${id}`, data), []);
  
  const setDashboard = useCallback((id: "D1" | "D2" | "D3") => {
    setState(prev => ({ ...prev, activeDashboard: id }));
    localStorage.setItem("aiventra_active_dashboard", id);
  }, []);

  // ─── Module Preferences ──────────────────────────────────
  const getModulePrefKey = useCallback(() => {
    try {
      const saved = localStorage.getItem("aiventra_user");
      if (saved) {
        const u = JSON.parse(saved);
        return u.email ? u.email.replace(/[.@]/g, "_") : "guest";
      }
    } catch {}
    return "guest";
  }, []);

  const toggleModule = useCallback((key: string) => {
    setState(prev => {
      const next = { ...prev.enabledModules, [key]: !prev.enabledModules[key] };
      const prefKey = getModulePrefKey();
      fbSet(`modulePreferences/${prefKey}/${key}`, next[key]);
      localStorage.setItem("aiventra_modules", JSON.stringify(next));
      return { ...prev, enabledModules: next };
    });
  }, [getModulePrefKey]);

  const setModuleEnabled = useCallback((key: string, enabled: boolean) => {
    setState(prev => {
      const next = { ...prev.enabledModules, [key]: enabled };
      const prefKey = getModulePrefKey();
      fbSet(`modulePreferences/${prefKey}/${key}`, enabled);
      localStorage.setItem("aiventra_modules", JSON.stringify(next));
      return { ...prev, enabledModules: next };
    });
  }, [getModulePrefKey]);

  const isModuleEnabled = useCallback((key: string) => {
    return !!state.enabledModules[key];
  }, [state.enabledModules]);

  // Load module preferences from Firebase on mount
  useEffect(() => {
    const prefKey = getModulePrefKey();
    const prefRef = ref(database, `modulePreferences/${prefKey}`);
    const unsub = onValue(prefRef, (snapshot) => {
      const val = snapshot.val();
      if (val && typeof val === "object") {
        setState(prev => ({
          ...prev,
          enabledModules: { ...getDefaultEnabledModules(), ...val },
        }));
      }
    });
    return () => unsub();
  }, [getModulePrefKey]);

  useEffect(() => {
    const saved = localStorage.getItem("aiventra_active_dashboard") as "D1" | "D2" | "D3";
    if (saved && ["D1", "D2", "D3"].includes(saved)) {
      setState(prev => ({ ...prev, activeDashboard: saved }));
    }
  }, []);

  useEffect(() => {
    // Sensor mock interval disabled as per user request
    /*
    const sensorInterval = setInterval(() => {
      const reading = generateMockSensorReading();
      setState(prev => {
        const nextSensors = [...prev.sensors];
        const updateSens = (name: string, val: any) => {
          const idx = nextSensors.findIndex(s => s.name === name);
          if (idx !== -1) {
            nextSensors[idx] = {
              ...nextSensors[idx],
              value: val,
              lastUpdated: reading.timestamp,
              history: [...nextSensors[idx].history.slice(1), { value: val, timestamp: reading.timestamp }]
            };
          }
        };
        updateSens("Temperature Sensor", parseFloat(reading.temperature.toFixed(1)));
        updateSens("Humidity Sensor", Math.round(reading.humidity));
        updateSens("Air Quality Monitor", Math.round(reading.aqi));
        updateSens("Motion Detector", reading.motion ? "DETECTED" : "CLEAR");
        updateSens("Vibration Sensor", reading.vibration);
        updateSens("GPS Tracker", `${reading.gps.lat.toFixed(4)}°N, ${reading.gps.lng.toFixed(4)}°E`);
        return { ...prev, sensors: nextSensors };
      });
    }, 3000);
    return () => clearInterval(sensorInterval);
    */
  }, []);

  const dispatch = useCallback((action: any) => {
    if (action.type === "ADD_NOTIFICATION") {
      const id = action.payload.id || genId("N");
      fbSet(`notifications/${id}`, { ...action.payload, id });
    } else if (action.type === "ADD_CORRELATION_EDGE") {
      const id = action.payload.id || genId("EDGE");
      fbSet(`correlationEdges/${id}`, { ...action.payload, id });
    }
  }, []);

  return (
    <DataContext.Provider value={{
      ...state,
      dispatch,
      addCase, updateCase, deleteCase,
      addEvidence, updateEvidence, deleteEvidence,
      addTimelineEvent, updateTimelineEvent, deleteTimelineEvent,
      updateSensor,
      addAnomaly, updateAnomaly, deleteAnomaly,
      addCustodyRecord,
      addNotification, markNotificationRead, markAllNotificationsRead, deleteNotification,
      addChatMessage,
      addCorrelationNode, addCorrelationEdge, deleteCorrelationEdge, updateCorrelationEdge,
      toggleModule, setModuleEnabled, isModuleEnabled,
      setDashboard
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
}
