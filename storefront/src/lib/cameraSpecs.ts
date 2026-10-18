import { useEffect, useState } from 'react';
import { hasSupabase, supabase } from './supabase';
import type { CameraSpec } from '../components/CameraSVG';
import { mockCameraSpecs } from '../mock';

// Module-level cache shared by every CasePreview instance on the page —
// mirrors admin/src/lib/cameraSpecs.ts. Storefront is read-only here (no
// invalidate needed — customers never edit specs, just see what admins saved).
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
