"use client";

import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import { formatTime } from "@/lib/utils";
import type { TimelineEvent } from "@/types";

const DefaultIcon = L.icon({ iconUrl: icon.src, shadowUrl: iconShadow.src });
L.Marker.prototype.options.icon = DefaultIcon;

const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';
const DEFAULT_CENTER: [number, number] = [13.0827, 80.2707];

const eventIcons: Record<string, (color: string) => L.DivIcon> = {
  CCTV: (c) => L.divIcon({ className: "", html: `<div style="width:20px;height:20px;background:${c};border-radius:50%;border:2px solid white;box-shadow:0 0 10px ${c}80;"></div>`, iconSize: [20, 20], iconAnchor: [10, 10] }),
  Motion: (c) => L.divIcon({ className: "", html: `<div style="width:20px;height:20px;background:${c};border-radius:50%;border:2px solid white;box-shadow:0 0 10px ${c}80;"></div>`, iconSize: [20, 20], iconAnchor: [10, 10] }),
  GPS: (c) => L.divIcon({ className: "", html: `<div style="width:20px;height:20px;background:${c};border-radius:2px;border:2px solid white;box-shadow:0 0 10px ${c}80;transform:rotate(45deg);"></div>`, iconSize: [20, 20], iconAnchor: [10, 10] }),
};

function getMarkerIcon(type: string, color: string): L.DivIcon {
  const builder = eventIcons[type] || ((c: string) =>
    L.divIcon({ className: "", html: `<div style="width:16px;height:16px;background:${c};border-radius:50%;border:2px solid white;"></div>`, iconSize: [16, 16], iconAnchor: [8, 8] }));
  return builder(color);
}

function MapController({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 15, { duration: 0.8 });
  }, [center, map]);
  return null;
}

interface MapContentProps {
  events: TimelineEvent[];
  gpsPositions: [number, number][];
  selectedEventId: string | null;
  mapCenter: [number, number] | null;
  onEventClick: (event: TimelineEvent) => void;
  typeColors: Record<string, string>;
}

export default function MapContent({ events, gpsPositions, selectedEventId, mapCenter, onEventClick, typeColors }: MapContentProps) {
  return (
    <MapContainer center={DEFAULT_CENTER} zoom={14} className="h-full w-full z-0" zoomControl={false}>
      <TileLayer url={TILE_URL} attribution={TILE_ATTR} />
      <MapController center={mapCenter} />

      {events.map((event) => {
        if (!event.location) return null;
        const color = typeColors[event.type] || "#6B7280";
        return (
          <Marker
            key={event.id}
            position={[event.location.lat, event.location.lng]}
            icon={getMarkerIcon(event.type, color)}
            eventHandlers={{ click: () => onEventClick(event) }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-bold">{event.title}</p>
                <p className="text-xs text-gray-600 mt-1">{event.description}</p>
                <p className="text-xs text-gray-500 mt-1 font-mono">{formatTime(event.timestamp)} &middot; {event.confidence}% confidence</p>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {gpsPositions.length > 1 && (
        <Polyline
          positions={gpsPositions}
          pathOptions={{ color: "#10B981", weight: 3, opacity: 0.7, dashArray: "10 6" }}
        />
      )}
    </MapContainer>
  );
}
