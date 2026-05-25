'use client';
import * as React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L, { type LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface LeafletMapProps {
  origin: { lat: number; lng: number; label: string };
  destination: { lat: number; lng: number; label: string };
  /** 0..1 — animates a truck marker along the route. */
  progress?: number;
  height?: number | string;
  className?: string;
}

/** Build a colored SVG marker — no external image dependencies. */
function buildIcon(color: string, label?: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-opacity="0.25"/>
        </filter>
      </defs>
      <path d="M18 0 C8 0 0 8 0 18 c0 13 18 30 18 30 s18-17 18-30 C36 8 28 0 18 0z"
            fill="${color}" stroke="white" stroke-width="2" filter="url(#shadow)"/>
      <circle cx="18" cy="17" r="6" fill="white"/>
      ${label ? `<text x="18" y="20.5" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="9" font-weight="700" fill="${color}">${label}</text>` : ''}
    </svg>`;
  return L.divIcon({
    html: svg,
    className: 'naqla-pin',
    iconSize: [36, 48],
    iconAnchor: [18, 48],
    popupAnchor: [0, -42],
  });
}

const ORIGIN_ICON = buildIcon('#0A3D3A', 'أ');
const DEST_ICON   = buildIcon('#00C9A7', 'ب');
const TRUCK_ICON  = L.divIcon({
  html: `
    <div style="width:32px;height:32px;background:#fff;border:2px solid #0A3D3A;border-radius:50%;display:grid;place-items:center;box-shadow:0 2px 6px rgba(0,0,0,.18)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0A3D3A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
        <path d="M15 18H9"/>
        <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
        <circle cx="17" cy="18" r="2"/>
        <circle cx="7" cy="18" r="2"/>
      </svg>
    </div>`,
  className: 'naqla-truck',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

/** Re-fit the map to the route whenever bounds change. */
function FitToBounds({ bounds }: { bounds: LatLngTuple[] }) {
  const map = useMap();
  React.useEffect(() => {
    if (bounds.length < 2) return;
    map.fitBounds(bounds as any, { padding: [40, 40] });
  }, [map, bounds]);
  return null;
}

export function LeafletMap({
  origin, destination, progress, height = 320, className,
}: LeafletMapProps) {
  const o: LatLngTuple = [origin.lat, origin.lng];
  const d: LatLngTuple = [destination.lat, destination.lng];

  const truckPos: LatLngTuple | null = React.useMemo(() => {
    if (progress === undefined || progress === null) return null;
    const t = Math.max(0, Math.min(1, progress));
    return [o[0] + (d[0] - o[0]) * t, o[1] + (d[1] - o[1]) * t];
  }, [progress, o, d]);

  return (
    <div
      className={className}
      style={{ height: typeof height === 'number' ? `${height}px` : height, position: 'relative', zIndex: 0 }}
    >
      <MapContainer
        center={[(o[0] + d[0]) / 2, (o[1] + d[1]) / 2]}
        zoom={6}
        style={{ height: '100%', width: '100%', borderRadius: 16 }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToBounds bounds={[o, d]} />
        <Polyline positions={[o, d]} pathOptions={{ color: '#0A3D3A', weight: 4, dashArray: '8 8', opacity: 0.7 }} />
        <Marker position={o} icon={ORIGIN_ICON}>
          <Popup><strong>{origin.label}</strong><br /><span style={{ color: '#6B7280' }}>نقطة الانطلاق</span></Popup>
        </Marker>
        <Marker position={d} icon={DEST_ICON}>
          <Popup><strong>{destination.label}</strong><br /><span style={{ color: '#6B7280' }}>نقطة الوصول</span></Popup>
        </Marker>
        {truckPos && (
          <Marker position={truckPos} icon={TRUCK_ICON}>
            <Popup>الشاحنة في الطريق</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

export default LeafletMap;
