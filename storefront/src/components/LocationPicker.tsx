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
  // Shaded circle showing the GPS fix's uncertainty radius — without it, an
  // auto-placed pin looks exactly as trustworthy as one the customer dragged
  // themselves, even when the browser is only estimating from WiFi/cell
  // towers (desktop, no GPS chip) and could be hundreds of meters off.
  const circleRef = useRef<L.Circle | null>(null);
  // Tracks whether a real location has been set (GPS or drag) — guards the
  // on-mount auto-detect from firing again once one has.
  const hasLocationRef = useRef(lat != null && lng != null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [accuracy, setAccuracy] = useState<number | null>(null);

  // Reads/writes the map only through mapRef/markerRef (never a closed-over
  // `map`/`marker`), so a pending request that resolves after this component
  // unmounts just no-ops instead of touching a torn-down Leaflet instance.
  const locateMe = () => {
    if (!navigator.geolocation) {
      setError("Location isn't supported on this device.");
      return;
    }
    setError('');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        hasLocationRef.current = true;
        const { latitude, longitude, accuracy: acc } = pos.coords;
        const point: [number, number] = [latitude, longitude];
        mapRef.current?.setView(point, 16);
        markerRef.current?.setLatLng(point);
        setAccuracy(acc);
        if (mapRef.current) {
          if (circleRef.current) circleRef.current.setLatLng(point).setRadius(acc);
          else circleRef.current = L.circle(point, { radius: acc, color: '#ff3e9a', weight: 1, fillOpacity: 0.12 }).addTo(mapRef.current);
        }
        onLocationChange(latitude, longitude);
        reverseGeocode(latitude, longitude).then((label) => label && onAddressChange(label));
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

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
      // A manual drag is the customer confirming the exact spot — the old
      // GPS uncertainty circle no longer applies.
      circleRef.current?.remove();
      circleRef.current = null;
      setAccuracy(null);
      const pos = marker.getLatLng();
      onLocationChange(pos.lat, pos.lng);
      reverseGeocode(pos.lat, pos.lng).then((label) => label && onAddressChange(label));
    });
    mapRef.current = map;
    markerRef.current = marker;

    // Default the pin to the customer's actual location instead of the
    // Phnom Penh fallback, as long as they haven't already searched/dragged
    // to somewhere else before this runs.
    if (!hasLocationRef.current) locateMe();

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
        <button type="button" className="btn soft location-pin-btn" onClick={locateMe} disabled={locating}>
          📍 {locating ? 'Finding…' : 'Pin location'}
        </button>
      </div>
      {error && <p className="location-error">{error}</p>}
      <p className="location-hint">
        {locating
          ? 'Finding your location…'
          : accuracy != null
            ? `📍 Accurate to within ~${Math.round(accuracy)}m — drag the pin for your exact spot`
            : 'Or drag the pin to your exact location'}
      </p>
      <div ref={mapElRef} className="location-map" />
    </div>
  );
}
