import { useEffect, useState } from 'react';
import { hasSupabase, supabase } from './supabase';
import { addCustomModels, removeCustomModel } from './types';
import type { PhoneModel } from './types';

// Mirrors cameraSpecs.ts's cache-once pattern. Rows added via the admin "Add
// Model" form merge into the hardcoded MODELS catalog (types.ts) so a new
// phone works everywhere without a code deploy — this module just drives
// that fetch/insert/delete and keeps a local id set so the UI knows which
// catalog entries are admin-added (and therefore safe to delete).
let customIds = new Set<string>();
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
      const rows = (data as Row[] | null) ?? [];
      const bad = rows.filter((r) => !isValidRow(r));
      if (bad.length) console.warn(`phone_models: ignoring ${bad.length} row(s) with missing/invalid height_mm or width_mm:`, bad.map((r) => r.id));
      const result = rows.filter(isValidRow).map(rowToModel);
      cache = result;
      customIds = new Set(result.map((m) => m.id));
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

export function isCustomModel(id: string): boolean {
  return customIds.has(id);
}

export async function addPhoneModel(model: PhoneModel): Promise<{ error: string | null }> {
  if (hasSupabase && supabase) {
    const { error } = await supabase.from('phone_models').insert({
      id: model.id, brand: model.brand, name: model.name, height_mm: model.heightMm, width_mm: model.widthMm,
    });
    if (error) return { error: error.message };
  }
  addCustomModels([model]);
  customIds.add(model.id);
  cache = [...(cache ?? []), model];
  return { error: null };
}

export async function deletePhoneModel(id: string): Promise<{ error: string | null }> {
  if (hasSupabase && supabase) {
    const { error } = await supabase.from('phone_models').delete().eq('id', id);
    if (error) return { error: error.message };
  }
  removeCustomModel(id);
  customIds.delete(id);
  cache = (cache ?? []).filter((m) => m.id !== id);
  return { error: null };
}
