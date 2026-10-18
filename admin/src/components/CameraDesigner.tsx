import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { CasePreview } from './CasePreview';
import { CameraShapeHandle } from './CameraShapeHandle';
import type { ShapePatch } from './CameraShapeHandle';
import { supabase } from '../lib/supabase';
import { invalidateCameraSpecsCache } from '../lib/cameraSpecs';
import { MODELS } from '../lib/types';
import type { PhoneModel } from '../lib/types';
import type { CameraSpec, IslandShape } from './CameraSVG';
import { mockCameraSpecs } from '../mock';

const DEFAULT_MODEL_ID = 'ip15pm';
const RENDER_WIDTH_PX = 380;
const phoneModels = Object.values(MODELS);
const BRAND_TABS: { brand: string; label: string }[] = [
  { brand: 'iPhone', label: 'iPhone' },
  { brand: 'Samsung', label: 'Samsung' },
  { brand: 'Xiaomi', label: 'Xiaomi' },
  { brand: 'OPPO', label: 'OPPO' },
];

function blankSpec(model: PhoneModel): CameraSpec {
  const w = model.widthMm;
  return {
    mounting: 'island',
    island: { shape: 'rounded-square', xMm: w * 0.08, yMm: w * 0.08, widthMm: w * 0.46, heightMm: w * 0.46, cornerRadiusMm: w * 0.12 },
    lenses: [{ label: 'wide', xMm: w * 0.31, yMm: w * 0.31, diameterMm: w * 0.2, ringMm: w * 0.018 }],
    flash: null,
    sensors: [],
  };
}

// Reference photos are editor-only (never shown to customers), so a slightly
// larger cap than customer design uploads is fine — more detail helps
// precise placement.
const MAX_UPLOAD_DIM = 2000;
function loadImageFile(file: File): Promise<{ dataUri: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const { naturalWidth: w, naturalHeight: h } = img;
        const scale = Math.min(1, MAX_UPLOAD_DIM / Math.max(w, h));
        if (scale === 1) { resolve({ dataUri: reader.result as string, width: w, height: h }); return; }
        const cw = Math.round(w * scale), ch = Math.round(h * scale);
        const canvas = document.createElement('canvas');
        canvas.width = cw; canvas.height = ch;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve({ dataUri: reader.result as string, width: w, height: h }); return; }
        ctx.drawImage(img, 0, 0, cw, ch);
        resolve({ dataUri: canvas.toDataURL('image/jpeg', 0.9), width: cw, height: ch });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

async function uploadReferencePhoto(dataUri: string): Promise<string> {
  const blob = await (await fetch(dataUri)).blob();
  const ext = (blob.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
  const path = `camera-refs/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase!.storage.from('design-photos').upload(path, blob, { contentType: blob.type });
  if (error) throw new Error(error.message);
  const { data } = supabase!.storage.from('design-photos').getPublicUrl(path);
  return data.publicUrl;
}

type PhotoState = { url: string | null; w: number | null; h: number | null };
type PhotoFit = { xMm: number; yMm: number; scale: number }; // scale = mm per photo-px

export function CameraDesigner({ role, myUserId }: { role: 'admin' | 'staff'; myUserId: string }) {
  const [modelId, setModelId] = useState(DEFAULT_MODEL_ID);
  const model = MODELS[modelId] ?? MODELS[DEFAULT_MODEL_ID];
  const [draftSpec, setDraftSpec] = useState<CameraSpec>(() => mockCameraSpecs[DEFAULT_MODEL_ID] ?? blankSpec(model));
  const [photo, setPhoto] = useState<PhotoState>({ url: null, w: null, h: null });
  const [photoFit, setPhotoFit] = useState<PhotoFit>({ xMm: 0, yMm: 0, scale: 0.2 });
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [configuredIds, setConfiguredIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshConfiguredIds = () => {
    if (!supabase) return;
    supabase.from('camera_specs').select('model_id').then(({ data }) => {
      if (data) setConfiguredIds(new Set(data.map((r) => r.model_id)));
    });
  };
  useEffect(refreshConfiguredIds, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setSelectedKey(null);
      if (supabase) {
        const { data } = await supabase.from('camera_specs').select('*').eq('model_id', modelId).maybeSingle();
        if (cancelled) return;
        if (data) {
          setDraftSpec(data.spec as CameraSpec);
          setPhoto({ url: data.reference_photo_url, w: data.reference_photo_w, h: data.reference_photo_h });
          setPhotoFit({
            xMm: data.reference_photo_offset_x_mm ?? 0,
            yMm: data.reference_photo_offset_y_mm ?? 0,
            scale: data.reference_photo_scale ?? (data.reference_photo_w ? model.widthMm / data.reference_photo_w : 0.2),
          });
        } else {
          setDraftSpec(blankSpec(model));
          setPhoto({ url: null, w: null, h: null });
          setPhotoFit({ xMm: 0, yMm: 0, scale: 0.2 });
        }
      } else {
        setDraftSpec(mockCameraSpecs[modelId] ?? blankSpec(model));
        setPhoto({ url: null, w: null, h: null });
        setPhotoFit({ xMm: 0, yMm: 0, scale: 0.2 });
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelId]);

  const pxPerMm = RENDER_WIDTH_PX / model.widthMm;
  const renderHeightPx = model.heightMm * pxPerMm;

  const onPhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const { dataUri, width, height } = await loadImageFile(file);
    setPhoto({ url: dataUri, w: width, h: height });
    setPhotoFit({ xMm: 0, yMm: 0, scale: model.widthMm / width });
    if (supabase) {
      try {
        const url = await uploadReferencePhoto(dataUri);
        setPhoto((p) => ({ ...p, url }));
      } catch (err) {
        window.alert(`Photo upload failed: ${err instanceof Error ? err.message : err}`);
      }
    }
  };

  const photoDrag = useRef<{ startXmm: number; startYmm: number; startClientX: number; startClientY: number } | null>(null);
  const onPhotoPointerDown = (e: ReactPointerEvent) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    photoDrag.current = { startXmm: photoFit.xMm, startYmm: photoFit.yMm, startClientX: e.clientX, startClientY: e.clientY };
  };
  const onPhotoPointerMove = (e: ReactPointerEvent) => {
    if (!photoDrag.current) return;
    const { startXmm, startYmm, startClientX, startClientY } = photoDrag.current;
    setPhotoFit((f) => ({ ...f, xMm: startXmm + (e.clientX - startClientX) / pxPerMm, yMm: startYmm + (e.clientY - startClientY) / pxPerMm }));
  };
  const onPhotoPointerUp = (e: ReactPointerEvent) => {
    photoDrag.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const updateIsland = (patch: ShapePatch) => setDraftSpec((s) => ({ ...s, island: { ...s.island, ...patch } }));
  const setIslandShape = (shape: IslandShape) => setDraftSpec((s) => ({
    ...s,
    island: {
      ...s.island,
      shape,
      extra: shape === 'compound' ? (s.island.extra ?? []) : undefined,
      notch: shape === 'irregular' ? (s.island.notch ?? { xMm: s.island.xMm + s.island.widthMm * 0.5, yMm: s.island.yMm, widthMm: s.island.widthMm * 0.3, heightMm: s.island.heightMm * 0.3 }) : undefined,
    },
  }));
  const addExtra = () => setDraftSpec((s) => ({ ...s, island: { ...s.island, extra: [...(s.island.extra ?? []), { shape: 'circle', xMm: s.island.xMm + s.island.widthMm, yMm: s.island.yMm + s.island.heightMm / 2, diameterMm: s.island.heightMm * 0.9 }] } }));
  const updateExtra = (i: number, patch: ShapePatch) => setDraftSpec((s) => {
    const extra = (s.island.extra ?? []).slice();
    extra[i] = { ...extra[i], ...patch } as typeof extra[number];
    return { ...s, island: { ...s.island, extra } };
  });
  const removeExtra = (i: number) => setDraftSpec((s) => ({ ...s, island: { ...s.island, extra: (s.island.extra ?? []).filter((_, idx) => idx !== i) } }));
  const updateNotch = (patch: ShapePatch) => setDraftSpec((s) => (s.island.notch ? { ...s, island: { ...s.island, notch: { ...s.island.notch, ...patch } } } : s));

  const addLens = () => setDraftSpec((s) => ({ ...s, lenses: [...s.lenses, { label: `lens ${s.lenses.length + 1}`, xMm: model.widthMm * 0.3, yMm: model.widthMm * 0.3, diameterMm: model.widthMm * 0.16, ringMm: model.widthMm * 0.015 }] }));
  const updateLens = (i: number, patch: ShapePatch) => setDraftSpec((s) => { const lenses = s.lenses.slice(); lenses[i] = { ...lenses[i], ...patch }; return { ...s, lenses }; });
  const renameLens = (i: number, label: string) => setDraftSpec((s) => { const lenses = s.lenses.slice(); lenses[i] = { ...lenses[i], label }; return { ...s, lenses }; });
  const removeLens = (i: number) => setDraftSpec((s) => ({ ...s, lenses: s.lenses.filter((_, idx) => idx !== i) }));

  const toggleFlash = () => setDraftSpec((s) => ({ ...s, flash: s.flash ? null : { xMm: model.widthMm * 0.2, yMm: model.widthMm * 0.1, diameterMm: model.widthMm * 0.06 } }));
  const updateFlash = (patch: ShapePatch) => setDraftSpec((s) => (s.flash ? { ...s, flash: { ...s.flash, ...patch } } : s));

  const addSensor = () => setDraftSpec((s) => ({ ...s, sensors: [...s.sensors, { type: 'sensor', xMm: model.widthMm * 0.35, yMm: model.widthMm * 0.35, diameterMm: model.widthMm * 0.05 }] }));
  const updateSensor = (i: number, patch: ShapePatch) => setDraftSpec((s) => { const sensors = s.sensors.slice(); sensors[i] = { ...sensors[i], ...patch }; return { ...s, sensors }; });
  const renameSensor = (i: number, type: string) => setDraftSpec((s) => { const sensors = s.sensors.slice(); sensors[i] = { ...sensors[i], type }; return { ...s, sensors }; });
  const removeSensor = (i: number) => setDraftSpec((s) => ({ ...s, sensors: s.sensors.filter((_, idx) => idx !== i) }));

  const save = async () => {
    if (!supabase) { window.alert('Connect Supabase to save camera designs — this is demo mode only.'); return; }
    setSaving(true);
    const { error } = await supabase.from('camera_specs').upsert({
      model_id: modelId,
      spec: draftSpec,
      reference_photo_url: photo.url,
      reference_photo_w: photo.w,
      reference_photo_h: photo.h,
      reference_photo_offset_x_mm: photoFit.xMm,
      reference_photo_offset_y_mm: photoFit.yMm,
      reference_photo_scale: photoFit.scale,
      updated_at: new Date().toISOString(),
      updated_by: myUserId || null,
    });
    setSaving(false);
    if (error) { window.alert(`Couldn't save: ${error.message}`); return; }
    invalidateCameraSpecsCache();
    refreshConfiguredIds();
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const revert = async () => {
    if (!window.confirm(`Remove the camera design for ${model.brand} ${model.name}? It'll fall back to the default rendering.`)) return;
    if (!supabase) { window.alert('Demo mode only.'); return; }
    const { error } = await supabase.from('camera_specs').delete().eq('model_id', modelId);
    if (error) { window.alert(`Couldn't remove: ${error.message}`); return; }
    invalidateCameraSpecsCache();
    refreshConfiguredIds();
    setDraftSpec(blankSpec(model));
    setPhoto({ url: null, w: null, h: null });
  };

  const photoWidthPx = (photo.w ?? 0) * photoFit.scale * pxPerMm;
  const photoHeightPx = (photo.h ?? 0) * photoFit.scale * pxPerMm;
  const zoomMin = photo.w ? (model.widthMm / photo.w) * 0.3 : 0.05;
  const zoomMax = photo.w ? (model.widthMm / photo.w) * 3 : 1;

  return (
    <>
      <div className="gallery-header">
        <div>
          <h1 className="page-title">Cameras</h1>
          <p className="page-sub">
            Design each phone's camera module by eye against a real photo — {configuredIds.size} of {phoneModels.length} done.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {saved && <span style={{ color: 'var(--success)', fontWeight: 700 }}>Saved ✓</span>}
          {role === 'admin' && <button className="btn ghost" onClick={revert}>🗑️ Remove design</button>}
          <button className="btn cool" onClick={save} disabled={saving || loading}>{saving ? 'Saving…' : '💾 Save'}</button>
        </div>
      </div>

      <div className="editor-body">
        <div className="editor-stage-wrap">
          <div className="editor-model-label">{model.brand} {model.name} — {model.widthMm}×{model.heightMm}mm</div>

          <div
            style={{ position: 'relative', width: RENDER_WIDTH_PX, height: renderHeightPx, background: '#242428', borderRadius: 18, overflow: 'hidden', touchAction: 'none' }}
            onPointerDown={() => setSelectedKey(null)}
          >
            <div style={{ position: 'absolute', inset: 0, border: '2px dashed rgba(255,255,255,0.3)', borderRadius: Math.min(RENDER_WIDTH_PX, renderHeightPx) * 0.14, pointerEvents: 'none' }} />
            {photo.url && (
              <img
                src={photo.url}
                alt=""
                draggable={false}
                onPointerDown={onPhotoPointerDown}
                onPointerMove={onPhotoPointerMove}
                onPointerUp={onPhotoPointerUp}
                style={{ position: 'absolute', left: photoFit.xMm * pxPerMm, top: photoFit.yMm * pxPerMm, width: photoWidthPx, height: photoHeightPx, cursor: 'grab', userSelect: 'none' }}
              />
            )}

            <CameraShapeHandle
              geom={{ kind: 'rect', ...draftSpec.island }}
              pxPerMm={pxPerMm}
              color="#FF3E9A"
              label="island"
              selected={selectedKey === 'island'}
              onSelect={() => setSelectedKey('island')}
              onChange={updateIsland}
            />
            {draftSpec.island.extra?.map((ex, i) => (
              <CameraShapeHandle
                key={`extra-${i}`}
                geom={{ kind: 'circle', xMm: ex.xMm, yMm: ex.yMm, diameterMm: ex.diameterMm }}
                pxPerMm={pxPerMm}
                color="#FF7EC0"
                label="extra"
                selected={selectedKey === `extra-${i}`}
                onSelect={() => setSelectedKey(`extra-${i}`)}
                onChange={(patch) => updateExtra(i, patch)}
              />
            ))}
            {draftSpec.island.notch && (
              <CameraShapeHandle
                geom={{ kind: 'rect', ...draftSpec.island.notch }}
                pxPerMm={pxPerMm}
                color="#8B4FD1"
                label="notch (cut out)"
                selected={selectedKey === 'notch'}
                onSelect={() => setSelectedKey('notch')}
                onChange={updateNotch}
              />
            )}
            {draftSpec.lenses.map((l, i) => (
              <CameraShapeHandle
                key={`lens-${i}`}
                geom={{ kind: 'circle', xMm: l.xMm, yMm: l.yMm, diameterMm: l.diameterMm }}
                pxPerMm={pxPerMm}
                color="#3EC8A0"
                label={l.label}
                selected={selectedKey === `lens-${i}`}
                onSelect={() => setSelectedKey(`lens-${i}`)}
                onChange={(patch) => updateLens(i, patch)}
              />
            ))}
            {draftSpec.flash && (
              <CameraShapeHandle
                geom={{ kind: 'circle', ...draftSpec.flash }}
                pxPerMm={pxPerMm}
                color="#FFD400"
                label="flash"
                selected={selectedKey === 'flash'}
                onSelect={() => setSelectedKey('flash')}
                onChange={updateFlash}
              />
            )}
            {draftSpec.sensors.map((s, i) => (
              <CameraShapeHandle
                key={`sensor-${i}`}
                geom={{ kind: 'circle', xMm: s.xMm, yMm: s.yMm, diameterMm: s.diameterMm }}
                pxPerMm={pxPerMm}
                color="#7B61FF"
                label={s.type}
                selected={selectedKey === `sensor-${i}`}
                onSelect={() => setSelectedKey(`sensor-${i}`)}
                onChange={(patch) => updateSensor(i, patch)}
              />
            ))}
          </div>

          <div className="editor-actions-row">
            <button className="btn soft" onClick={() => fileInputRef.current?.click()}>{photo.url ? '🔁 Replace reference photo' : '📷 Upload reference photo'}</button>
            {photo.url && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-faint)' }}>
                Zoom
                <input
                  type="range"
                  min={zoomMin}
                  max={zoomMax}
                  step={(zoomMax - zoomMin) / 200 || 0.001}
                  value={photoFit.scale}
                  onChange={(e) => setPhotoFit((f) => ({ ...f, scale: Number(e.target.value) }))}
                />
              </label>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPhotoFile} />
          <p className="page-sub" style={{ maxWidth: RENDER_WIDTH_PX }}>Drag the photo to line it up with the dashed phone outline, then drag the colored shapes onto the real lenses/flash/sensors. Drag a shape's corner dot to resize it.</p>
        </div>

        <div className="editor-tool-panel" style={{ flex: '1 1 420px', minWidth: 320, maxWidth: 520 }}>
          <div className="editor-tabbar" style={{ marginBottom: 12 }}>
            {BRAND_TABS.map((b) => (
              <button
                key={b.brand}
                className={`chip-pick ${model.brand === b.brand ? 'on' : ''}`}
                onClick={() => { const first = phoneModels.find((m) => m.brand === b.brand); if (first) setModelId(first.id); }}
              >
                {b.label}
              </button>
            ))}
          </div>
          <div className="editor-model-grid" style={{ marginBottom: 20 }}>
            {phoneModels.filter((m) => m.brand === model.brand).map((m) => (
              <button key={m.id} className={`chip-pick ${modelId === m.id ? 'on' : ''}`} onClick={() => setModelId(m.id)}>
                {configuredIds.has(m.id) ? '✓ ' : ''}{m.name}
              </button>
            ))}
          </div>

          <h3 style={{ margin: '0 0 8px' }}>Island</h3>
          <select className="status" style={{ marginBottom: 12, width: '100%' }} value={draftSpec.island.shape} onChange={(e) => setIslandShape(e.target.value as IslandShape)}>
            <option value="rounded-square">Rounded square (iPhone-style)</option>
            <option value="rounded-rect">Rounded rectangle</option>
            <option value="pill">Pill (vertical strip)</option>
            <option value="compound">Compound (extra circle island)</option>
            <option value="irregular">Irregular (notched)</option>
            <option value="none">None (lenses only, no plate)</option>
          </select>
          {draftSpec.island.shape === 'compound' && (
            <>
              {(draftSpec.island.extra ?? []).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <span className="page-sub" style={{ margin: 0, flex: 1 }}>Extra circle {i + 1}</span>
                  <button className="tpl-delete" onClick={() => removeExtra(i)} title="Remove extra circle">🗑️</button>
                </div>
              ))}
              <button className="btn soft" style={{ marginBottom: 12 }} onClick={addExtra}>+ Extra circle island</button>
            </>
          )}

          <h3 style={{ margin: '0 0 8px' }}>Lenses ({draftSpec.lenses.length})</h3>
          {draftSpec.lenses.map((l, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input className="bg-field" style={{ flex: 1 }} value={l.label} onChange={(e) => renameLens(i, e.target.value)} />
              <button className="tpl-delete" onClick={() => removeLens(i)} title="Remove lens">🗑️</button>
            </div>
          ))}
          <button className="btn soft" style={{ marginBottom: 20 }} onClick={addLens}>+ Add lens</button>

          <h3 style={{ margin: '0 0 8px' }}>Flash</h3>
          <button className="btn soft" style={{ marginBottom: 20 }} onClick={toggleFlash}>{draftSpec.flash ? '✕ Remove flash' : '+ Add flash'}</button>

          <h3 style={{ margin: '0 0 8px' }}>Sensors ({draftSpec.sensors.length})</h3>
          {draftSpec.sensors.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input className="bg-field" style={{ flex: 1 }} value={s.type} onChange={(e) => renameSensor(i, e.target.value)} placeholder="e.g. lidar, mic" />
              <button className="tpl-delete" onClick={() => removeSensor(i)} title="Remove sensor">🗑️</button>
            </div>
          ))}
          <button className="btn soft" style={{ marginBottom: 20 }} onClick={addSensor}>+ Add sensor</button>

          <h3 style={{ margin: '0 0 8px' }}>Live preview</h3>
          <p className="page-sub" style={{ margin: '0 0 10px' }}>Exactly how this renders on a real case.</p>
          <CasePreview background={null} layers={[]} modelId={modelId} width={160} cameraSpecOverride={draftSpec} />
        </div>
      </div>
    </>
  );
}
