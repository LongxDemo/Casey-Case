import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Default pin before the customer searches or drags — Casey's home turf.
const DEFAULT_CENTER: [number, number] = [11.5564, 104.9282]; // Phnom Penh

// Leaflet's default marker icon references its image files with paths
// relative to the CSS, which breaks once Vite bundles everything — point it
// at the actual built asset URLs instead, or every pin renders invisible.
const markerIcon = L.icon({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIcon2xUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`);
  const results = (await res.json()) as Array<{ lat: string; lon: string }>;
  if (!results.length) return null;
  return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
  const data = (await res.json()) as { display_name?: string };
  return data.display_name ?? null;
}

export function LocationPicker({
  address,
  onAddressChange,
  lat,
  lng,
  onLocationChange,
}: {
  address: string;
  onAddressChange: (value: string) => void;
  lat: number | null;
  lng: number | null;
  onLocationChange: (lat: number, lng: number) => void;
}) {
  const mapElRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  // Tracks whether a real location has been set (geolocation, search, or
  // drag) — guards against a slow geolocation response clobbering a location
  // the customer already picked another way in the meantime.
  const hasLocationRef = useRef(lat != null && lng != null);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;
    const start = lat != null && lng != null ? ([lat, lng] as [number, number]) : DEFAULT_CENTER;
    const map = L.map(mapElRef.current).setView(start, lat != null ? 16 : 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    const marker = L.marker(start, { draggable: true, icon: markerIcon }).addTo(map);
    marker.on('dragend', () => {
      hasLocationRef.current = true;
      const pos = marker.getLatLng();
      onLocationChange(pos.lat, pos.lng);
      reverseGeocode(pos.lat, pos.lng).then((label) => label && onAddressChange(label));
    });
    mapRef.current = map;
    markerRef.current = marker;

    // getCurrentPosition can't be cancelled, and the customer may close the
    // modal (unmounting this map) before the browser's permission prompt is
    // even answered — this flag stops the callback from touching a map
    // that's already been torn down.
    let cancelled = false;

    // Default the pin to the customer's actual location instead of the
    // Phnom Penh fallback, as long as they haven't already searched/dragged
    // to somewhere else while the browser's permission prompt was pending.
    if (!hasLocationRef.current && navigator.geolocation) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (cancelled) return;
          setLocating(false);
          if (hasLocationRef.current) return;
          hasLocationRef.current = true;
          const { latitude, longitude } = pos.coords;
          map.setView([latitude, longitude], 16);
          marker.setLatLng([latitude, longitude]);
          onLocationChange(latitude, longitude);
          reverseGeocode(latitude, longitude).then((label) => !cancelled && label && onAddressChange(label));
        },
        () => !cancelled && setLocating(false),
        { enableHighAccuracy: true, timeout: 10000 },
      );
    }

    return () => {
      cancelled = true;
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Mount once — marker drags always report through the latest onLocationChange/
    // onAddressChange via the closure below, which React keeps stable (state setters).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (lat == null || lng == null || !mapRef.current || !markerRef.current) return;
    markerRef.current.setLatLng([lat, lng]);
    mapRef.current.setView([lat, lng], 16);
  }, [lat, lng]);

  const pinLocation = async () => {
    if (!address.trim()) {
      setError('Type an address first');
      return;
    }
    setSearching(true);
    setError('');
    try {
      const found = await geocode(address.trim());
      if (!found) {
        setError("Couldn't find that address — try dragging the pin instead");
        return;
      }
      hasLocationRef.current = true;
      onLocationChange(found.lat, found.lng);
    } catch {
      setError('Search failed — try dragging the pin instead');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="location-picker">
      <label>Address (optional)</label>
      <div className="location-row">
        <input
          className="f"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder="123 Phnom Penh"
        />
        <button type="button" className="btn soft location-pin-btn" onClick={pinLocation} disabled={searching}>
          📍 {searching ? 'Finding…' : 'Pin location'}
        </button>
      </div>
      {error && <p className="location-error">{error}</p>}
      <p className="location-hint">{locating ? 'Finding your location…' : 'Or drag the pin to your exact location'}</p>
      <div ref={mapElRef} className="location-map" />
    </div>
  );
}
