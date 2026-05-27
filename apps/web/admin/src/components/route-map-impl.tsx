'use client';
import * as React from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L, { type LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface RoutePoint {
  lat: number;
  lng: number;
  label: string;
}

export interface RouteMapImplProps {
  origin: RoutePoint;
  destination: RoutePoint;
  /** 0..1 — animates a truck marker along the route. Optional. */
  progress?: number;
  height?: number;
}

const pinSvg = (color: string, letter: string) => `
<svg xmlns="http://www.w3.org/2000/svg" width="34" height="46" viewBox="0 0 34 46">
  <defs><filter id="s" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-opacity="0.25"/>
  </filter></defs>
  <path d="M17 0 C7.5 0 0 7.5 0 17 c0 12 17 29 17 29 s17-17 17-29 C34 7.5 26.5 0 17 0z"
        fill="${color}" stroke="white" stroke-width="2" filter="url(#s)"/>
  <circle cx="17" cy="16" r="6" fill="white"/>
  <text x="17" y="19.5" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="8" font-weight="700" fill="${color}">${letter}</text>
</svg>`;

const ORIGIN_ICON = L.divIcon({
  html: pinSvg('#0A3D3A', 'A'),
  className: 'nitaq-pin',
  iconSize: [34, 46],
  iconAnchor: [17, 46],
  popupAnchor: [0, -40],
});
const DEST_ICON = L.divIcon({
  html: pinSvg('#00C9A7', 'B'),
  className: 'nitaq-pin',
  iconSize: [34, 46],
  iconAnchor: [17, 46],
  popupAnchor: [0, -40],
});
const TRUCK_ICON = L.divIcon({
  html: `
    <div style="width:30px;height:30px;background:#fff;border:2px solid #0A3D3A;border-radius:50%;display:grid;place-items:center;box-shadow:0 2px 6px rgba(0,0,0,.18)">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0A3D3A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/>
        <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
        <circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>
      </svg>
    </div>`,
  className: 'nitaq-truck',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

function FitBounds({ bounds }: { bounds: LatLngTuple[] }) {
  const map = useMap();
  React.useEffect(() => {
    if (bounds.length < 2) return;
    map.fitBounds(bounds as any, { padding: [40, 40] });
  }, [map, bounds]);
  return null;
}

export function RouteMapImpl({ origin, destination, progress, height = 300 }: RouteMapImplProps) {
  const o: LatLngTuple = [origin.lat, origin.lng];
  const d: LatLngTuple = [destination.lat, destination.lng];
  const truckPos: LatLngTuple | null =
    progress === undefined || progress === null
      ? null
      : [o[0] + (d[0] - o[0]) * progress, o[1] + (d[1] - o[1]) * progress];

  return (
    <div style={{ height, position: 'relative', zIndex: 0 }}>
      <MapContainer
        center={[(o[0] + d[0]) / 2, (o[1] + d[1]) / 2]}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds bounds={[o, d]} />
        <Polyline positions={[o, d]} pathOptions={{ color: '#0A3D3A', weight: 4, opacity: 0.85 }} />
        <Marker position={o} icon={ORIGIN_ICON}>
          <Popup><strong>{origin.label}</strong><br /><span style={{ color: '#6B7280' }}>نقطة الانطلاق</span></Popup>
        </Marker>
        <Marker position={d} icon={DEST_ICON}>
          <Popup><strong>{destination.label}</strong><br /><span style={{ color: '#6B7280' }}>نقطة الوصول</span></Popup>
        </Marker>
        {truckPos && (
          <Marker position={truckPos} icon={TRUCK_ICON}>
            <Popup>قيد التنفيذ</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
