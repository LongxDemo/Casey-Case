import { useEffect, useState } from 'react';
import { hasSupabase, supabase } from './supabase';
import type { CameraSpec } from '../components/CameraSVG';
import { mockCameraSpecs } from '../mock';

// Module-level cache shared by every CasePreview instance on the page — specs
// rarely change and are read far more often than written, so one fetch per
// page load (not per render) is enough. CameraDesigner calls
// invalidateCameraSpecsCache() after a save so its own preview picks it up.
let cache: Record<string, CameraSpec> | null = null;
let inflight: Promise<Record<string, CameraSpec>> | null = null;

async function loadSpecs(): Promise<Record<string, CameraSpec>> {
  if (cache) return cache;
  if (!inflight) {
    inflight = (async () => {
      if (!hasSupabase || !supabase) {
        cache = mockCameraSpecs;
        return mockCameraSpecs;
      }
      const { data } = await supabase.from('camera_specs').select('model_id, spec');
      const result: Record<string, CameraSpec> = Object.fromEntries((data ?? []).map((r) => [r.model_id, r.spec as CameraSpec]));
      cache = result;
      return result;
    })();
  }
  return inflight;
}

export function useCameraSpecs(): Record<string, CameraSpec> {
  const [specs, setSpecs] = useState<Record<string, CameraSpec>>(cache ?? {});
  useEffect(() => {
    if (cache) return;
    let live = true;
    loadSpecs().then((s) => { if (live) setSpecs(s); });
    return () => { live = false; };
  }, []);
  return specs;
}

export function invalidateCameraSpecsCache() {
  cache = null;
  inflight = null;
}
