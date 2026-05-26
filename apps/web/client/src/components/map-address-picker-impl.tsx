'use client';
import { useEffect, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L, { type LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Loader2, MapPin } from 'lucide-react';

export interface MapPoint {
  lat: number;
  lng: number;
  address: string;
}

interface MapAddressPickerImplProps {
  /** Initial center (typically the city center). */
  center: { lat: number; lng: number };
  /** Initial point, if any (e.g., when editing an existing order). */
  value?: MapPoint;
  /** Fires on every commit (marker drag end, map click, or search-result select). */
  onChange: (point: MapPoint) => void;
  /** Visible height in px. */
  height?: number;
  /** Hint text used in the search input placeholder + as the marker initial label. */
  label: string;
  /**
   * Optional city name — when present, Nominatim search is constrained to a
   * ~50km viewbox around the city center, so searching for "حي السلي" inside
   * Riyadh doesn't return matches from Jeddah.
   */
  cityName?: string;
}

const PIN_ICON = L.divIcon({
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" width="34" height="46" viewBox="0 0 34 46">
      <defs><filter id="ds" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-opacity="0.25"/>
      </filter></defs>
      <path d="M17 0 C7.5 0 0 7.5 0 17 c0 12 17 29 17 29 s17-17 17-29 C34 7.5 26.5 0 17 0z"
            fill="#0A3D3A" stroke="white" stroke-width="2" filter="url(#ds)"/>
      <circle cx="17" cy="16" r="6" fill="white"/>
    </svg>`,
  className: 'nitaq-pin-picker',
  iconSize: [34, 46],
  iconAnchor: [17, 46],
});

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

/**
 * Calls Nominatim's free public endpoint for address search.
 * Notes:
 *   - Bounded to KSA (`countrycodes=sa`) to filter out irrelevant results.
 *   - Use sparingly — Nominatim's TOS requires ≤ 1 req/sec.
 *   - Returns Arabic results when `accept-language: ar` is sent.
 */
async function searchAddress(
  query: string,
  signal: AbortSignal,
  bounds?: { lat: number; lng: number; radiusKm: number },
): Promise<NominatimResult[]> {
  if (!query.trim()) return [];
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('countrycodes', 'sa');
  url.searchParams.set('limit', '6');
  url.searchParams.set('addressdetails', '1');
  if (bounds) {
    // Approximate a `radiusKm` bounding box. 1° latitude ≈ 111km. Longitude is
    // scaled by cos(latitude) since meridians converge at the poles.
    const dLat = bounds.radiusKm / 111;
    const dLng = bounds.radiusKm / (111 * Math.cos((bounds.lat * Math.PI) / 180));
    const left   = bounds.lng - dLng;
    const right  = bounds.lng + dLng;
    const top    = bounds.lat + dLat;
    const bottom = bounds.lat - dLat;
    // viewbox format: left,top,right,bottom (Nominatim's order)
    url.searchParams.set('viewbox', `${left},${top},${right},${bottom}`);
    url.searchParams.set('bounded', '1');   // hard-restrict results to this box
  }
  const res = await fetch(url, {
    signal,
    headers: { 'Accept-Language': 'ar' },
  });
  if (!res.ok) return [];
  return (await res.json()) as NominatimResult[];
}

function ReCenter({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom(), { animate: true });
  }, [center.lat, center.lng, map]);
  return null;
}

function ClickHandler({ onClick }: { onClick: (latlng: LatLng) => void }) {
  useMapEvents({
    click(e) { onClick(e.latlng); },
  });
  return null;
}

export function MapAddressPickerImpl({
  center, value, onChange, height = 280, label, cityName,
}: MapAddressPickerImplProps) {
  const [point, setPoint] = useState<MapPoint | null>(value ?? null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const markerRef = useRef<L.Marker | null>(null);

  // Debounced search — fires 350ms after the user stops typing.
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        // Constrain search to ~50km around the city center when a city is
        // specified — prevents Riyadh searches from returning Jeddah hits.
        const bounds = cityName ? { lat: center.lat, lng: center.lng, radiusKm: 50 } : undefined;
        // Augment the user query with the city name to bias Nominatim toward
        // results inside that city even within the box.
        const augmented = cityName ? `${query} ${cityName}` : query;
        const r = await searchAddress(augmented, ctrl.signal, bounds);
        setResults(r);
        setOpen(r.length > 0);
      } catch {
        // Aborted or network error — silent.
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [query, cityName, center.lat, center.lng]);

  const commit = (next: MapPoint) => {
    setPoint(next);
    onChange(next);
  };

  const selectResult = (r: NominatimResult) => {
    commit({ lat: Number(r.lat), lng: Number(r.lon), address: r.display_name });
    setQuery(r.display_name);
    setOpen(false);
  };

  const onMarkerDragEnd = () => {
    const m = markerRef.current;
    if (!m) return;
    const pos = m.getLatLng();
    commit({ lat: pos.lat, lng: pos.lng, address: point?.address ?? label });
  };

  return (
    <div className="space-y-2">
      {/* Search */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder={`ابحث عن ${label}...`}
            className="w-full ps-9 pe-9 py-2 rounded-md border bg-background text-sm"
          />
          {loading && <Loader2 className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        {open && results.length > 0 && (
          <ul className="absolute z-[1000] top-full mt-1 inset-x-0 max-h-60 overflow-y-auto rounded-md border bg-card shadow-lg text-sm">
            {results.map((r) => (
              <li key={r.place_id}>
                <button
                  type="button"
                  onClick={() => selectResult(r)}
                  className="w-full text-start px-3 py-2 hover:bg-muted transition-colors flex items-start gap-2"
                >
                  <MapPin className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                  <span className="line-clamp-2">{r.display_name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Map */}
      <div className="rounded-lg overflow-hidden border" style={{ height }}>
        <MapContainer
          center={[point?.lat ?? center.lat, point?.lng ?? center.lng]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {/* keep view in sync with city changes */}
          <ReCenter center={point ? { lat: point.lat, lng: point.lng } : center} />
          {/* click-to-place */}
          <ClickHandler onClick={(ll) => commit({ lat: ll.lat, lng: ll.lng, address: point?.address ?? label })} />
          {point && (
            <Marker
              position={[point.lat, point.lng]}
              icon={PIN_ICON}
              draggable
              eventHandlers={{ dragend: onMarkerDragEnd }}
              ref={(m) => { markerRef.current = m; }}
            />
          )}
        </MapContainer>
      </div>

      {/* Selected coords readout */}
      {point && (
        <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-mono num" dir="ltr">
          <MapPin className="h-3.5 w-3.5" />
          {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
        </div>
      )}
    </div>
  );
}
