import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { CasePreview } from './CasePreview';
import { EditableLayer } from './EditableLayer';
import { hasSupabase, supabase } from '../lib/supabase';
import { aspectOf, CANVAS_BASE, MODELS, sizeForModel } from '../lib/types';
import type { BackgroundRow, CaseBackground, Layer } from '../lib/types';
import { FRAME_DEFS, frameOrder } from '../lib/frames';
import { mockBackgrounds, stickerPacks } from '../mock';

const TEXT_COLORS = ['#FFFFFF', '#141018', '#FF3E9A', '#D6006E', '#FFD400', '#7B61FF', '#3EC8A0', '#FF5470'];
// Templates aren't tied to a device — a customer's chosen phone model
// reflows the design automatically when they start from this template
// (same as every existing gallery template). The model picker here is a
// preview-only convenience so an admin can check other case shapes before
// saving; it defaults to the model CasePreview itself falls back to
// whenever a template has no device tied to it (Gallery cards render the
// same way).
const DEFAULT_PREVIEW_MODEL_ID = 'ip15pm';
const EDIT_WIDTH = 340;
const phoneModels = Object.values(MODELS);
const BRAND_TABS: { brand: string; label: string }[] = [
  { brand: 'iPhone', label: 'iPhone' },
  { brand: 'Samsung', label: 'Samsung' },
  { brand: 'Xiaomi', label: 'Xiaomi' },
  { brand: 'OPPO', label: 'OPPO' },
];

let counter = 0;
const uid = (p = 'l') => `${p}_${Date.now().toString(36)}_${(counter++).toString(36)}`;
const nextZ = (layers: Layer[]) => (layers.length ? Math.max(...layers.map((l) => l.z)) + 1 : 1);
const toCaseBackground = (b: BackgroundRow): CaseBackground => ({ id: b.id, name: b.name, colors: b.colors, ...(b.pattern ? { pattern: b.pattern } : {}) });

// Mirrors storefront/src/App.tsx's loadAndResizeImage — downscales before the
// photo ever becomes a layer's uri, same cap, so an admin-uploaded template
// photo is never bigger than one a customer would upload themselves.
const MAX_UPLOAD_DIM = 1600;
function loadAndResizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const { naturalWidth: w, naturalHeight: h } = img;
        const scale = Math.min(1, MAX_UPLOAD_DIM / Math.max(w, h));
        if (scale === 1) {
          resolve(reader.result as string);
          return;
        }
        const cw = Math.round(w * scale), ch = Math.round(h * scale);
        const canvas = document.createElement('canvas');
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, cw, ch);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// Mirrors storefront's uploadDataUri/uploadPhotoLayers — moves any base64
// photo onto the same `design-photos` storage bucket customer uploads use,
// and swaps the data: URI for the public URL, so the templates row (and
// every Gallery/home-screen fetch of it) stays small.
async function uploadDataUri(uri: string): Promise<string> {
  const blob = await (await fetch(uri)).blob();
  const ext = (blob.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase!.storage.from('design-photos').upload(path, blob, { contentType: blob.type });
  if (error) throw new Error(`photo upload — ${error.message}`);
  const { data } = supabase!.storage.from('design-photos').getPublicUrl(path);
  return data.publicUrl;
}
async function uploadPhotoLayers(layers: Layer[]): Promise<Layer[]> {
  if (!supabase) return layers;
  const out: Layer[] = [];
  for (const l of layers) {
    if (l.kind === 'image' && l.uri?.startsWith('data:')) {
      out.push({ ...l, uri: await uploadDataUri(l.uri) });
    } else if (l.kind === 'frame' && (l.photoUri?.startsWith('data:') || l.photo2Uri?.startsWith('data:'))) {
      out.push({
        ...l,
        photoUri: l.photoUri?.startsWith('data:') ? await uploadDataUri(l.photoUri) : l.photoUri,
        photo2Uri: l.photo2Uri?.startsWith('data:') ? await uploadDataUri(l.photo2Uri) : l.photo2Uri,
      });
    } else {
      out.push(l);
    }
  }
  return out;
}

type Tool = 'text' | 'stickers' | 'frames' | 'photo' | 'color' | 'model';

export function TemplateEditor({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [background, setBackground] = useState<CaseBackground>(() => toCaseBackground(mockBackgrounds[0]));
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adjustFrameId, setAdjustFrameId] = useState<string | null>(null);
  const [adjustHole, setAdjustHole] = useState<1 | 2>(1);
  const [tool, setTool] = useState<Tool>('text');
  const [previewModelId, setPreviewModelId] = useState<string>(DEFAULT_PREVIEW_MODEL_ID);
  const [stickerPackId, setStickerPackId] = useState(stickerPacks[0].id);
  const [paletteBackgrounds, setPaletteBackgrounds] = useState<BackgroundRow[]>(mockBackgrounds);
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadTarget = useRef<{ id: string; hole: 1 | 2 } | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.from('backgrounds').select('*').eq('active', true).order('sort', { ascending: true })
      .then(({ data }) => data && setPaletteBackgrounds(data as BackgroundRow[]));
  }, []);

  const selected = layers.find((l) => l.id === selectedId) ?? null;
  const previewModel = MODELS[previewModelId] ?? MODELS[DEFAULT_PREVIEW_MODEL_ID];

  const addText = () => {
    const layer: Layer = { id: uid(), kind: 'text', text: 'Tap to edit', color: '#FFFFFF', fontSize: 30, fontWeight: '800', align: 'center', tx: 0, ty: 0, scale: 1, rotation: 0, z: nextZ(layers) };
    setLayers((ls) => [...ls, layer]);
    setSelectedId(layer.id);
  };
  const addSticker = (emoji: string) => {
    const layer: Layer = { id: uid(), kind: 'sticker', emoji, size: 64, tx: 0, ty: 0, scale: 1, rotation: 0, z: nextZ(layers) };
    setLayers((ls) => [...ls, layer]);
    setSelectedId(layer.id);
  };
  const addFrame = (frameId: string) => {
    const def = FRAME_DEFS[frameId];
    const layer: Layer = {
      id: uid(), kind: 'frame', frameId, photoUri: null, photoTx: 0, photoTy: 0, photoScale: 1,
      ...(def?.hole2 ? { photo2Uri: null, photo2Tx: 0, photo2Ty: 0, photo2Scale: 1 } : {}),
      tx: 0, ty: 0, scale: def?.defaultScale ?? 1, rotation: 0, z: nextZ(layers),
    };
    setLayers((ls) => [...ls, layer]);
    setSelectedId(layer.id);
  };
  // Full-case "tap to add your photo" placeholder — stays empty until a
  // customer starts a design from this template, same as the hand-seeded
  // "Your Photo, Full Case" template.
  const addPlaceholderImage = () => {
    const canvasH = CANVAS_BASE / aspectOf(previewModel);
    const layer: Layer = { id: uid(), kind: 'image', uri: null, width: CANVAS_BASE, height: canvasH, radius: 0, tx: 0, ty: 0, scale: 1, rotation: 0, z: nextZ(layers) };
    setLayers((ls) => [...ls, layer]);
    setSelectedId(layer.id);
  };
  // A freeform "photo hole" the admin places, sizes and shapes themselves —
  // same underlying `image` layer as the full-case placeholder, just small
  // and round by default — so a custom hole shape never needs a hand-coded
  // FrameDef. Drag to move, use the corner handle to resize (stays round:
  // radius is always half the layer's own width, which the handle scales
  // uniformly), and the Round/Square toggle switches the corner shape.
  const PHOTO_HOLE_SIZE = 140;
  const addPhotoHole = () => {
    const layer: Layer = { id: uid(), kind: 'image', uri: null, width: PHOTO_HOLE_SIZE, height: PHOTO_HOLE_SIZE, radius: PHOTO_HOLE_SIZE / 2, tx: 0, ty: 0, scale: 1, rotation: 0, z: nextZ(layers) };
    setLayers((ls) => [...ls, layer]);
    setSelectedId(layer.id);
  };
  const updateLayer = (id: string, patch: Partial<Layer>) =>
    setLayers((ls) => ls.map((l) => (l.id === id ? ({ ...l, ...patch } as Layer) : l)));
  const removeLayer = (id: string) => {
    setLayers((ls) => ls.filter((l) => l.id !== id));
    setSelectedId((s) => (s === id ? null : s));
    setAdjustFrameId((a) => (a === id ? null : a));
  };
  const select = (id: string | null) => {
    setSelectedId(id);
    setAdjustFrameId((a) => (a === id ? a : null));
  };
  const enterAdjustMode = (id: string, hole: 1 | 2 = 1) => {
    setAdjustFrameId(id);
    setAdjustHole(hole);
  };
  const exitAdjustMode = () => setAdjustFrameId(null);
  const duplicateLayer = (id: string) => {
    const src = layers.find((l) => l.id === id);
    if (!src) return;
    const copy = { ...src, id: uid(), tx: src.tx + 20, ty: src.ty + 20, z: nextZ(layers) } as Layer;
    setLayers((ls) => [...ls, copy]);
    setSelectedId(copy.id);
  };
  const bringToFront = (id: string) =>
    setLayers((ls) => ls.map((l) => (l.id === id ? { ...l, z: nextZ(ls) } : l)));

  const pickPhoto = (id: string, hole: 1 | 2 = 1) => {
    uploadTarget.current = { id, hole };
    fileInputRef.current?.click();
  };
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const target = uploadTarget.current;
    uploadTarget.current = null;
    e.target.value = '';
    if (!file || !target) return;
    loadAndResizeImage(file).then((uri) => {
      const targetLayer = layers.find((l) => l.id === target.id);
      if (targetLayer?.kind === 'image') {
        updateLayer(target.id, { uri });
      } else if (target.hole === 2) {
        updateLayer(target.id, { photo2Uri: uri, photo2Tx: 0, photo2Ty: 0, photo2Scale: 1 });
      } else {
        updateLayer(target.id, { photoUri: uri, photoTx: 0, photoTy: 0, photoScale: 1 });
      }
    });
  };

  const cancel = () => {
    if (layers.length > 0 && !window.confirm('Discard this template?')) return;
    onClose();
  };

  const save = async () => {
    if (!name.trim()) {
      window.alert('Give this template a name first.');
      return;
    }
    if (!supabase) {
      window.alert('Connect Supabase to publish to the gallery — this is demo mode only.');
      return;
    }
    setSaving(true);
    let uploadedLayers: Layer[];
    try {
      uploadedLayers = await uploadPhotoLayers(layers);
    } catch (err) {
      setSaving(false);
      window.alert(err instanceof Error ? err.message : 'Photo upload failed.');
      return;
    }
    const id = `t-${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40)}-${Math.random().toString(36).slice(2, 6)}`;
    const accent = background.colors[0] ?? '#FF3E9A';
    const { error } = await supabase.from('templates').insert({
      id,
      name: name.trim(),
      tag: tag.trim() || null,
      accent,
      background,
      layers: uploadedLayers,
      active: true,
    });
    setSaving(false);
    if (error) {
      window.alert(`Failed: ${error.message}`);
      return;
    }
    onClose();
  };

  const { width: renderWidth } = sizeForModel(previewModel, EDIT_WIDTH);
  const scale = renderWidth / CANVAS_BASE;

  return (
    <>
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileChange} />
      <div className="editor-topbar">
        <div style={{ display: 'flex', gap: 10, flex: 1, maxWidth: 480 }}>
          <input className="f" placeholder="Template name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="f" placeholder="Tag (optional)" value={tag} onChange={(e) => setTag(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn ghost" onClick={cancel}>✕ Cancel</button>
          <button className="btn cool" onClick={save} disabled={saving}>{saving ? 'Saving…' : '💾 Save Template'}</button>
        </div>
      </div>

      <div className="editor-body">
        <div className="editor-stage-wrap">
          <div className="editor-model-label">{previewModel.brand} {previewModel.name}</div>
          <CasePreview
            background={background}
            layers={layers}
            modelId={previewModelId}
            width={EDIT_WIDTH}
            innerRef={canvasRef}
            renderLayer={(l) => (
              <EditableLayer
                layer={l}
                selected={l.id === selectedId}
                scale={scale}
                canvasRef={canvasRef}
                onSelect={select}
                onChange={updateLayer}
                adjustHole={l.id === adjustFrameId ? adjustHole : null}
                onRequestPhoto={pickPhoto}
              />
            )}
          />
          {selected && selected.kind === 'frame' && adjustFrameId === selected.id ? (
            <div className="editor-actions-row">
              <button
                className="btn soft"
                onClick={() => (adjustHole === 2
                  ? updateLayer(selected.id, { photo2Scale: Math.max(0.5, (selected.photo2Scale ?? 1) / 1.15) })
                  : updateLayer(selected.id, { photoScale: Math.max(0.5, selected.photoScale / 1.15) }))}
              >➖ Zoom out</button>
              <button
                className="btn soft"
                onClick={() => (adjustHole === 2
                  ? updateLayer(selected.id, { photo2Scale: Math.min(4, (selected.photo2Scale ?? 1) * 1.15) })
                  : updateLayer(selected.id, { photoScale: Math.min(4, selected.photoScale * 1.15) }))}
              >➕ Zoom in</button>
              <button className="btn cool" onClick={exitAdjustMode}>✓ Done</button>
            </div>
          ) : selected && (
            <div className="editor-actions-row">
              {selected.kind === 'image' && (
                <>
                  <button className="btn soft" onClick={() => pickPhoto(selected.id)}>{selected.uri ? '🔁 Replace Photo' : '📷 Add Photo'}</button>
                  <button className="btn soft" onClick={() => updateLayer(selected.id, { radius: selected.width / 2 })}>⚪ Round</button>
                  <button className="btn soft" onClick={() => updateLayer(selected.id, { radius: 0 })}>▭ Square</button>
                </>
              )}
              {selected.kind === 'frame' && !FRAME_DEFS[selected.frameId]?.hole2 && (
                selected.photoUri ? (
                  <>
                    <button className="btn soft" onClick={() => enterAdjustMode(selected.id, 1)}>🎯 Adjust Photo</button>
                    <button className="btn soft" onClick={() => pickPhoto(selected.id, 1)}>🔁 Replace Photo</button>
                  </>
                ) : (
                  <button className="btn soft" onClick={() => pickPhoto(selected.id, 1)}>📷 Add Photo</button>
                )
              )}
              {selected.kind === 'frame' && FRAME_DEFS[selected.frameId]?.hole2 && (
                <>
                  {selected.photoUri ? (
                    <>
                      <button className="btn soft" onClick={() => enterAdjustMode(selected.id, 1)}>🎯 Adjust 1</button>
                      <button className="btn soft" onClick={() => pickPhoto(selected.id, 1)}>🔁 Replace 1</button>
                    </>
                  ) : (
                    <button className="btn soft" onClick={() => pickPhoto(selected.id, 1)}>📷 Photo 1</button>
                  )}
                  {selected.photo2Uri ? (
                    <>
                      <button className="btn soft" onClick={() => enterAdjustMode(selected.id, 2)}>🎯 Adjust 2</button>
                      <button className="btn soft" onClick={() => pickPhoto(selected.id, 2)}>🔁 Replace 2</button>
                    </>
                  ) : (
                    <button className="btn soft" onClick={() => pickPhoto(selected.id, 2)}>📷 Photo 2</button>
                  )}
                </>
              )}
              <button className="btn soft" onClick={() => duplicateLayer(selected.id)}>⧉ Duplicate</button>
              <button className="btn soft" onClick={() => bringToFront(selected.id)}>⬆ Front</button>
              <button className="btn soft" onClick={() => removeLayer(selected.id)}>🗑️ Delete</button>
            </div>
          )}
        </div>

        <div className="card editor-panel">
          <div className="editor-tabbar">
            {(['text', 'stickers', 'frames', 'photo', 'color', 'model'] as Tool[]).map((t) => (
              <button key={t} className={`chip-pick ${tool === t ? 'on' : ''}`} onClick={() => setTool(t)}>
                {t === 'text' ? '✏️ Text' : t === 'stickers' ? '🎀 Stickers' : t === 'frames' ? '🖼️ Frames' : t === 'photo' ? '📷 Photo' : t === 'color' ? '🎨 Color' : '📱 Model'}
              </button>
            ))}
          </div>

          <div className="editor-tool-panel">
            {tool === 'text' && (
              <>
                <button className="btn" onClick={addText}>+ Add text</button>
                {selected?.kind === 'text' && (
                  <div style={{ marginTop: 14 }}>
                    <textarea
                      className="f"
                      rows={3}
                      value={selected.text}
                      onChange={(e) => updateLayer(selected.id, { text: e.target.value })}
                    />
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10 }}>
                      <button className="chip-pick" onClick={() => updateLayer(selected.id, { fontSize: Math.max(12, selected.fontSize - 2) })}>A−</button>
                      <span style={{ fontWeight: 700 }}>{selected.fontSize}px</span>
                      <button className="chip-pick" onClick={() => updateLayer(selected.id, { fontSize: Math.min(80, selected.fontSize + 2) })}>A+</button>
                    </div>
                    <div className="editor-swatch-row">
                      {TEXT_COLORS.map((c) => (
                        <button
                          key={c}
                          className="editor-swatch"
                          style={{ background: c, outline: selected.color === c ? '2.5px solid var(--pink)' : 'none' }}
                          onClick={() => updateLayer(selected.id, { color: c })}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {tool === 'stickers' && (
              <>
                <div className="editor-tabbar" style={{ marginBottom: 12 }}>
                  {stickerPacks.map((p) => (
                    <button key={p.id} className={`chip-pick ${stickerPackId === p.id ? 'on' : ''}`} onClick={() => setStickerPackId(p.id)}>
                      {p.cover} {p.name}
                    </button>
                  ))}
                </div>
                <div className="editor-sticker-grid">
                  {stickerPacks.find((p) => p.id === stickerPackId)?.stickers.map((s) => (
                    <button key={s.id} className="editor-sticker-btn" onClick={() => addSticker(s.emoji!)}>{s.emoji}</button>
                  ))}
                </div>
              </>
            )}

            {tool === 'frames' && (
              <div className="editor-frame-grid">
                {frameOrder.map((id) => {
                  const def = FRAME_DEFS[id];
                  if (!def) return null;
                  const w = 64;
                  const h = w * (def.height / def.width);
                  return (
                    <button key={id} className="editor-frame-btn" onClick={() => addFrame(id)} title={def.name}>
                      {def.image ? <img src={def.image} alt="" style={{ width: w, height: h, objectFit: 'contain' }} /> : def.Svg ? <def.Svg style={{ width: w, height: h }} /> : null}
                      <span>{def.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {tool === 'photo' && (
              <>
                <p className="page-sub" style={{ margin: '0 0 12px' }}>
                  A photo hole you place, resize and shape yourself — drag it, use the corner handle to resize, and toggle Round/Square once it's selected. Leave it empty for customers to fill in, or use "Add Photo" below to bake in a specific photo.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
                  <button className="btn" onClick={addPhotoHole}>+ Add photo hole</button>
                  <button className="btn soft" onClick={addPlaceholderImage}>+ Add full-case photo</button>
                </div>
              </>
            )}

            {tool === 'color' && (
              <>
                {!hasSupabase && <p className="page-sub" style={{ margin: '0 0 12px' }}>Demo mode — showing sample colors.</p>}
                <div className="editor-color-grid">
                  {paletteBackgrounds.map((b) => (
                    <button
                      key={b.id}
                      className="editor-color-swatch"
                      title={b.name}
                      style={{
                        background: `linear-gradient(135deg, ${b.colors[0]}, ${b.colors[b.colors.length - 1]})`,
                        outline: background.id === b.id ? '3px solid var(--pink)' : 'none',
                      }}
                      onClick={() => setBackground(toCaseBackground(b))}
                    />
                  ))}
                </div>
              </>
            )}

            {tool === 'model' && (
              <>
                <p className="page-sub" style={{ margin: '0 0 12px' }}>
                  Preview only — this doesn't get saved with the template. A customer's own phone model reflows the design automatically.
                </p>
                <div className="editor-tabbar" style={{ marginBottom: 12 }}>
                  {BRAND_TABS.map((b) => (
                    <button
                      key={b.brand}
                      className={`chip-pick ${previewModel.brand === b.brand ? 'on' : ''}`}
                      onClick={() => {
                        if (previewModel.brand === b.brand) return;
                        const first = phoneModels.find((m) => m.brand === b.brand);
                        if (first) setPreviewModelId(first.id);
                      }}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
                <div className="editor-model-grid">
                  {phoneModels.filter((m) => m.brand === previewModel.brand).map((m) => (
                    <button key={m.id} className={`chip-pick ${previewModelId === m.id ? 'on' : ''}`} onClick={() => setPreviewModelId(m.id)}>
                      {m.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
