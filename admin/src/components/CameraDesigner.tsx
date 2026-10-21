import { useEffect, useId, useRef, useState } from 'react';
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
import { legacyCamStyle, legacyRealPhotoRect, loadImageSize } from '../lib/legacyCamera';

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
// `format` defaults to JPEG (fine for reference photos — never shown to
// customers, and JPEG keeps the data URI small). Camera-module template
// uploads pass 'image/png' instead: JPEG has no alpha channel, so
// downsizing through it was silently flattening any transparent case-body
// pixels to opaque black, which extractCameraModule below then misread as
// part of the module itself — confirmed on a real S25 template upload
// (2026-10-19) where the whole phone body got treated as "camera".
function loadImageFile(file: File, format: 'image/jpeg' | 'image/png' = 'image/jpeg'): Promise<{ dataUri: string; width: number; height: number }> {
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
        resolve({ dataUri: format === 'image/png' ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.9), width: cw, height: ch });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

async function uploadDesignPhoto(dataUri: string, folder: string): Promise<string> {
  const blob = await (await fetch(dataUri)).blob();
  const ext = (blob.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase!.storage.from('design-photos').upload(path, blob, { contentType: blob.type });
  if (error) throw new Error(error.message);
  const { data } = supabase!.storage.from('design-photos').getPublicUrl(path);
  return data.publicUrl;
}

function loadImageEl(dataUri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUri;
  });
}

// Isolates a camera module from a phone-template photo — e.g. a "T-FRAME"
// reference render, which may already have the case body cut to transparent
// (alpha 0) around an opaque module, or may be a flattened photo with a
// plain white case body — without requiring the admin to pre-cut a
// transparent PNG themselves. Mirrors the green-marker frame-hole trick
// (detect by color, cut to alpha) but classifies by "not transparent, not
// the background color, not white" instead of a single marker color, since
// the module here is the real photographed hardware rather than a flat
// marker shape.
//
// The SAME boolean color test (`isModulePixel` below) drives both the
// bounding-box detection AND the output alpha — they used to be two
// different tests (a hard threshold for the bbox, a separately-feathered
// smoothstep for the output alpha), which could disagree: the feathered
// alpha sometimes stayed faintly visible past where the bbox's own padding
// assumed it had already faded to nothing, flush against the crop's edge
// on whichever side had a softer gradient in the source photo — while the
// opposite side kept its full padding, making the module look off-center
// once a cutout margin was drawn around it (confirmed on a real S26 Ultra
// upload, 2026-10-19). Using one shared test for both guarantees they can
// never disagree, at the cost of a slightly harder (non-anti-aliased) cut
// edge instead of a soft feather.
async function extractCameraModule(dataUri: string): Promise<{ dataUri: string; w: number; h: number }> {
  const img = await loadImageEl(dataUri);
  const w = img.naturalWidth, h = img.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const { data } = ctx.getImageData(0, 0, w, h);
  const idx = (x: number, y: number) => (y * w + x) * 4;
  const distTo = (i: number, r: number, g: number, b: number) => Math.hypot(data[i] - r, data[i + 1] - g, data[i + 2] - b);
  const bg = idx(0, 0);
  const bgR = data[bg], bgG = data[bg + 1], bgB = data[bg + 2];
  const BG_TOL = 30, WHITE_TOL = 35;

  // A pixel belongs to the module if it's opaque, inside the phone
  // silhouette (not background), and not the case body itself (not white).
  // The alpha check matters when the body was already cut to transparent
  // (alpha 0) — those pixels' leftover RGB is meaningless and would
  // otherwise look like "not white, not background" by color alone.
  const isModulePixel = (i: number) => data[i + 3] > 128 && distTo(i, bgR, bgG, bgB) > BG_TOL && distTo(i, 255, 255, 255) > WHITE_TOL;
  const candidate = new Uint8Array(w * h);
  for (let p = 0; p < w * h; p++) candidate[p] = isModulePixel(p * 4) ? 1 : 0;

  // Flood-fill connected components, labeling every pixel with which
  // component it belongs to — discarding any component that touches the
  // image border (that's the phone's own outline stroke running edge-to-edge
  // around the whole silhouette, not the module, which always sits inset).
  // Labeling (rather than just re-testing isModulePixel per output pixel)
  // matters: a stray, unconnected fleck of module-colored pixels near the
  // crop's edge — e.g. anti-aliasing on the phone's own rounded corner —
  // could independently pass isModulePixel without being part of the real
  // module, making the output's own visible footprint bigger than the
  // "best" component's bbox on just that side and throwing off centering
  // once a cutout margin was drawn around it (confirmed on a real S26 Ultra
  // upload, 2026-10-19). Restricting the output to only the labeled "best"
  // component's own pixels guarantees the stored crop's visible content is
  // exactly what the bbox (and therefore the padding/centering) was based on.
  const label = new Int32Array(w * h).fill(-1);
  let best: { id: number; minX: number; minY: number; maxX: number; maxY: number; size: number } | null = null;
  const stack: number[] = [];
  let nextId = 0;
  for (let start = 0; start < w * h; start++) {
    if (!candidate[start] || label[start] !== -1) continue;
    const id = nextId++;
    label[start] = id;
    stack.push(start);
    let minX = start % w, maxX = minX, minY = (start / w) | 0, maxY = minY, size = 0, touchesBorder = false;
    while (stack.length) {
      const p = stack.pop()!;
      const x = p % w, y = (p / w) | 0;
      size++;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) touchesBorder = true;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      const neighbors: [number, number][] = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
      for (const [nx, ny] of neighbors) {
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const np = ny * w + nx;
        if (label[np] !== -1 || !candidate[np]) continue;
        label[np] = id;
        stack.push(np);
      }
    }
    if (touchesBorder) continue;
    if (!best || size > best.size) best = { id, minX, minY, maxX, maxY, size };
  }
  if (!best) throw new Error("Couldn't find the camera module in that photo — it needs a plain background and a white case body, with the module itself clearly darker/different.");

  const pad = Math.max(4, Math.round(Math.min(w, h) * 0.01));
  // The SAME padding on all four sides — if the module sits close to the
  // source photo's own edge on just one side, shrink padding uniformly on
  // every side instead of silently dropping it on only that side (which
  // left the stored crop's content flush against one edge and padded on
  // the opposite, making the module look off-center once a cutout margin
  // was added around it — confirmed on a real S26 Ultra upload 2026-10-19).
  const safePad = Math.max(0, Math.min(pad, best.minX, best.minY, w - 1 - best.maxX, h - 1 - best.maxY));
  const cropX = best.minX - safePad, cropY = best.minY - safePad;
  const cropW = (best.maxX - best.minX + 1) + safePad * 2;
  const cropH = (best.maxY - best.minY + 1) + safePad * 2;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = cropW; outCanvas.height = cropH;
  const outCtx = outCanvas.getContext('2d')!;
  const outData = outCtx.createImageData(cropW, cropH);
  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const srcX = x + cropX, srcY = y + cropY;
      const srcI = idx(srcX, srcY);
      const dstI = (y * cropW + x) * 4;
      outData.data[dstI] = data[srcI];
      outData.data[dstI + 1] = data[srcI + 1];
      outData.data[dstI + 2] = data[srcI + 2];
      outData.data[dstI + 3] = label[srcY * w + srcX] === best.id ? data[srcI + 3] : 0;
    }
  }
  outCtx.putImageData(outData, 0, 0);
  return { dataUri: outCanvas.toDataURL('image/png'), w: cropW, h: cropH };
}

type PhotoState = { url: string | null; w: number | null; h: number | null };
type PhotoFit = { xMm: number; yMm: number; scale: number }; // scale = mm per photo-px

export function CameraDesigner({ role, myUserId }: { role: 'admin' | 'staff'; myUserId: string }) {
  const cameraCutoutFilterId = useId();
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
  const [importingLegacy, setImportingLegacy] = useState(false);
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
        const url = await uploadDesignPhoto(dataUri, 'camera-refs');
        setPhoto((p) => ({ ...p, url }));
      } catch (err) {
        window.alert(`Photo upload failed: ${err instanceof Error ? err.message : err}`);
      }
    }
  };

  const cameraImageInputRef = useRef<HTMLInputElement>(null);
  const onCameraImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const { dataUri } = await loadImageFile(file, 'image/png');
    let cropped: { dataUri: string; w: number; h: number };
    try {
      cropped = await extractCameraModule(dataUri);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : String(err));
      return;
    }
    const scaleMmPerPx = (model.widthMm * 0.4) / cropped.w;
    setDraftSpec((s) => ({
      ...s,
      image: { url: cropped.dataUri, wPx: cropped.w, hPx: cropped.h, xMm: model.widthMm * 0.06, yMm: model.widthMm * 0.06, scaleMmPerPx },
    }));
    if (supabase) {
      try {
        const url = await uploadDesignPhoto(cropped.dataUri, 'camera-modules');
        setDraftSpec((s) => (s.image ? { ...s, image: { ...s.image, url } } : s));
      } catch (err) {
        window.alert(`Camera photo upload failed: ${err instanceof Error ? err.message : err}`);
      }
    }
  };
  const removeCameraImage = () => setDraftSpec((s) => ({ ...s, image: undefined }));

  const cameraImageDrag = useRef<{ startXmm: number; startYmm: number; startClientX: number; startClientY: number } | null>(null);
  const onCameraImagePointerDown = (e: ReactPointerEvent) => {
    e.stopPropagation();
    if (!draftSpec.image) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    cameraImageDrag.current = { startXmm: draftSpec.image.xMm, startYmm: draftSpec.image.yMm, startClientX: e.clientX, startClientY: e.clientY };
  };
  const onCameraImagePointerMove = (e: ReactPointerEvent) => {
    if (!cameraImageDrag.current) return;
    const { startXmm, startYmm, startClientX, startClientY } = cameraImageDrag.current;
    setDraftSpec((s) => (s.image ? { ...s, image: { ...s.image, xMm: startXmm + (e.clientX - startClientX) / pxPerMm, yMm: startYmm + (e.clientY - startClientY) / pxPerMm } } : s));
  };
  const onCameraImagePointerUp = (e: ReactPointerEvent) => {
    cameraImageDrag.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
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

  // Only non-null for models the live storefront already renders with a real
  // photo via the pre-admin-tool hardcoded system (iPhones, mostly) — see
  // lib/legacyCamera.ts. Pulls that exact photo + position into draftSpec as
  // a starting point, WITHOUT saving — the admin reviews it in Live Preview
  // and can nudge it before Save actually writes a camera_specs row.
  const importableLegacyStyle = legacyCamStyle(model);

  const importLegacyDesign = async () => {
    if (!importableLegacyStyle) return;
    setImportingLegacy(true);
    try {
      const rect = legacyRealPhotoRect(importableLegacyStyle, RENDER_WIDTH_PX, renderHeightPx);
      // Loaded under the admin app's OWN /admin/ base (same file, admin has
      // its own copy under public/camera/) just to read its native pixel
      // size — the saved image.url below stays root-relative so the
      // storefront (no /admin/ base) resolves it correctly.
      const { w: wPx, h: hPx } = await loadImageSize(`${import.meta.env.BASE_URL}camera/${rect.file}`);
      const targetWidthMm = rect.width / pxPerMm;
      setDraftSpec((s) => ({
        ...s,
        image: {
          url: `/camera/${rect.file}`,
          wPx,
          hPx,
          xMm: rect.left / pxPerMm,
          yMm: rect.top / pxPerMm,
          scaleMmPerPx: targetWidthMm / wPx,
        },
      }));
    } catch {
      window.alert("Couldn't load the existing camera photo to import.");
    } finally {
      setImportingLegacy(false);
    }
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

      <div className="editor-body" style={{ flexWrap: 'nowrap', overflowX: 'auto' }}>
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

            {draftSpec.image ? (
              <>
                {/* The die-cut cutout — the same photo, dilated outward by a
                    uniform pixel radius (same technique as CasePreview's
                    CameraImageModule — see its comment for why a plain
                    scaled-up copy looks lopsided for an irregular module
                    shape) — so you can see the actual hole shape and its
                    manufacturing tolerance while still dragging/zooming the
                    photo into place, not just in the small Live preview.
                    Non-interactive so dragging still targets the photo. */}
                <svg width={0} height={0} style={{ position: 'absolute' }} aria-hidden="true">
                  <filter id={cameraCutoutFilterId} x="-200%" y="-200%" width="500%" height="500%">
                    <feMorphology operator="dilate" radius={(draftSpec.image.marginMm ?? 1.2) * pxPerMm} />
                  </filter>
                </svg>
                <img
                  src={draftSpec.image.url}
                  alt=""
                  draggable={false}
                  style={{
                    position: 'absolute',
                    left: draftSpec.image.xMm * pxPerMm,
                    top: draftSpec.image.yMm * pxPerMm,
                    width: draftSpec.image.wPx * draftSpec.image.scaleMmPerPx * pxPerMm,
                    height: draftSpec.image.hPx * draftSpec.image.scaleMmPerPx * pxPerMm,
                    filter: `url(#${cameraCutoutFilterId}) brightness(0)`,
                    pointerEvents: 'none',
                  }}
                />
                <img
                  src={draftSpec.image.url}
                  alt=""
                  draggable={false}
                  onPointerDown={onCameraImagePointerDown}
                  onPointerMove={onCameraImagePointerMove}
                  onPointerUp={onCameraImagePointerUp}
                  style={{
                    position: 'absolute',
                    left: draftSpec.image.xMm * pxPerMm,
                    top: draftSpec.image.yMm * pxPerMm,
                    width: draftSpec.image.wPx * draftSpec.image.scaleMmPerPx * pxPerMm,
                    height: draftSpec.image.hPx * draftSpec.image.scaleMmPerPx * pxPerMm,
                    cursor: 'grab',
                    userSelect: 'none',
                    outline: '2px solid #3EC8A0',
                    outlineOffset: 2,
                  }}
                />
              </>
            ) : (
              <>
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
              </>
            )}
          </div>

          {importableLegacyStyle && !draftSpec.image && !configuredIds.has(modelId) && (
            <div className="notice" style={{ margin: 0, maxWidth: RENDER_WIDTH_PX, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span>This model already has a real photo live on the storefront (from the old system) — import it here to edit it.</span>
              <button className="btn soft" onClick={importLegacyDesign} disabled={importingLegacy} style={{ flex: 'none' }}>
                {importingLegacy ? 'Importing…' : '⬇ Import existing design'}
              </button>
            </div>
          )}

          <div className="editor-actions-row" style={{ maxWidth: RENDER_WIDTH_PX, flexWrap: 'wrap' }}>
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
            <button className="btn soft" onClick={() => cameraImageInputRef.current?.click()}>{draftSpec.image ? '🔁 Replace camera photo' : '📷 Upload camera photo'}</button>
            {draftSpec.image && (
              <>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-faint)' }}>
                  Zoom
                  <input
                    type="range"
                    min={(model.widthMm / draftSpec.image.wPx) * 0.3}
                    max={(model.widthMm / draftSpec.image.wPx) * 3}
                    step={((model.widthMm / draftSpec.image.wPx) * 2.7) / 200 || 0.001}
                    value={draftSpec.image.scaleMmPerPx}
                    onChange={(e) => setDraftSpec((s) => (s.image ? { ...s, image: { ...s.image, scaleMmPerPx: Number(e.target.value) } } : s))}
                  />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-faint)' }}>
                  Cutout margin
                  <input
                    type="range"
                    min={0}
                    max={12}
                    step={0.1}
                    value={draftSpec.image.marginMm ?? 1.2}
                    onChange={(e) => setDraftSpec((s) => (s.image ? { ...s, image: { ...s.image, marginMm: Number(e.target.value) } } : s))}
                  />
                  {(draftSpec.image.marginMm ?? 1.2).toFixed(1)}mm
                </label>
                <button className="btn ghost" onClick={removeCameraImage}>✕ Remove camera photo</button>
              </>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPhotoFile} />
          <input ref={cameraImageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onCameraImageFile} />
          <p className="page-sub" style={{ maxWidth: RENDER_WIDTH_PX }}>
            {draftSpec.image
              ? "Drag the green-outlined camera photo to line it up with the dashed phone outline, and use Zoom to size it."
              : 'Drag the photo to line it up with the dashed phone outline, then drag the colored shapes onto the real lenses/flash/sensors. Drag a shape\'s corner dot to resize it.'}
          </p>
        </div>

        <div style={{ flex: '0 1 200px', minWidth: 180 }}>
          <h3 style={{ margin: '0 0 8px' }}>Live preview</h3>
          <p className="page-sub" style={{ margin: '0 0 10px' }}>Exactly how this renders on a real case.</p>
          <CasePreview background={null} layers={[]} modelId={modelId} width={160} cameraSpecOverride={draftSpec} />
        </div>

        <div className="editor-tool-panel" style={{ flex: '1 1 320px', minWidth: 260, maxWidth: 420 }}>
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

          {draftSpec.image ? (
            <p className="page-sub">
              Using a real camera photo for this model. Remove it (above the stage) to go back to hand-drawn island/lens/flash/sensor shapes.
            </p>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </>
  );
}
