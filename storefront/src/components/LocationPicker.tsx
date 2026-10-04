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
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;
    const start = lat != null && lng != null ? ([lat, lng] as [number, number]) : DEFAULT_CENTER;
    const map = L.map(mapElRef.current).setView(start, 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    const marker = L.marker(start, { draggable: true, icon: markerIcon }).addTo(map);
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      onLocationChange(pos.lat, pos.lng);
      reverseGeocode(pos.lat, pos.lng).then((label) => label && onAddressChange(label));
    });
    mapRef.current = map;
    markerRef.current = marker;
    return () => {
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
      <p className="location-hint">Or drag the pin to your exact location</p>
      <div ref={mapElRef} className="location-map" />
    </div>
  );
}
