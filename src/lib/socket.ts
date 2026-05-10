// import { generateMockSensorReading } from "./mock-data";

type EventCallback = (...args: unknown[]) => void;

export class MockWebSocket {
  private listeners: Map<string, EventCallback[]> = new Map();
  private intervals: ReturnType<typeof setInterval>[] = [];
  private _connected = false;

  get connected() {
    return this._connected;
  }

  connect() {
    this._connected = true;
    this.emit("connected", { status: "live", timestamp: new Date().toISOString() });

    // Mock data intervals disabled as per user request to use real-time data only
    /*
    this.intervals.push(setInterval(() => {
      this.emit("sensor-update", generateMockSensorReading());
    }, 3000));

    this.intervals.push(setInterval(() => {
      if (Math.random() > 0.92) {
        this.emit("alert", {
          id: `ALERT-${Date.now()}`,
          severity: Math.random() > 0.7 ? "critical" : "warning",
          title: "Motion Detected — PIR-01",
          description: `Movement detected at sensor coordinates.`,
          timestamp: new Date().toISOString(),
        });
      }
    }, 8000));

    this.intervals.push(setInterval(() => {
      this.emit("risk-update", {
        score: Math.floor(70 + Math.random() * 25),
        change: Math.random() > 0.5 ? 1 : -1,
      });
    }, 10000));

    this.intervals.push(setInterval(() => {
      this.emit("notification", {
        id: `N-${Date.now()}`,
        type: ["alert", "sensor", "evidence", "system"][Math.floor(Math.random() * 4)],
        severity: Math.random() > 0.7 ? "critical" : "info",
        title: "New event recorded",
        description: "A new event has been logged in the system.",
        timestamp: new Date().toISOString(),
        read: false,
      });
    }, 15000));
    */
  }

  disconnect() {
    this.intervals.forEach(clearInterval);
    this.intervals = [];
    this._connected = false;
    this.emit("disconnected", {});
  }

  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback) {
    const cbs = this.listeners.get(event);
    if (cbs) {
      this.listeners.set(event, cbs.filter(cb => cb !== callback));
    }
  }

  emit(event: string, ...args: unknown[]) {
    const cbs = this.listeners.get(event);
    if (cbs) {
      cbs.forEach(cb => cb(...args));
    }
  }
}

let globalSocket: MockWebSocket | null = null;

export function getSocket(): MockWebSocket {
  if (!globalSocket) {
    globalSocket = new MockWebSocket();
  }
  return globalSocket;
}
