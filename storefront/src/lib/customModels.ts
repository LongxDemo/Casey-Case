import { useEffect, useState } from 'react';
import { hasSupabase, supabase } from './supabase';
import { addCustomModels } from './types';
import type { PhoneModel } from './types';

// Mirrors cameraSpecs.ts's cache-once pattern. Phones the admin added via
// the dashboard's "Add Model" form (phone_models table) merge into the
// hardcoded MODELS catalog (types.ts) — read-only here, the storefront never
// writes to this table.
let cache: PhoneModel[] | null = null;
let inflight: Promise<PhoneModel[]> | null = null;

type Row = { id: string; brand: string; name: string; height_mm: number | null; width_mm: number | null };
const rowToModel = (r: Row): PhoneModel => ({ id: r.id, brand: r.brand, name: r.name, heightMm: r.height_mm as number, widthMm: r.width_mm as number });

// Guards against bad rows reaching the catalog merge — e.g. a row left over
// from provisioning (null height_mm/width_mm before this feature existed)
// would otherwise silently stomp a real hardcoded model with NaN dimensions.
const isValidRow = (r: Row): boolean =>
  !!r.id && !!r.brand && !!r.name && Number.isFinite(r.height_mm) && (r.height_mm as number) > 0 && Number.isFinite(r.width_mm) && (r.width_mm as number) > 0;

async function loadCustomModels(): Promise<PhoneModel[]> {
  if (cache) return cache;
  if (!inflight) {
    inflight = (async () => {
      if (!hasSupabase || !supabase) { cache = []; return []; }
      const { data } = await supabase.from('phone_models').select('id, brand, name, height_mm, width_mm');
      const result = ((data as Row[] | null) ?? []).filter(isValidRow).map(rowToModel);
      cache = result;
      return result;
    })();
  }
  return inflight;
}

export function useCustomModels(): void {
  const [, setVersion] = useState(0);
  useEffect(() => {
    let live = true;
    loadCustomModels().then((rows) => {
      addCustomModels(rows);
      if (live) setVersion((v) => v + 1);
    });
    return () => { live = false; };
  }, []);
}
