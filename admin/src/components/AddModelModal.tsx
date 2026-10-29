import { useState } from 'react';
import { phoneModels } from '../lib/types';
import type { PhoneModel } from '../lib/types';
import { addPhoneModel } from '../lib/customModels';

// Phones ship in generations only ~1-2mm apart from their predecessor, so
// "clone a close model" gets a new entry to a usable size with zero lookup.
// The diagonal estimator is the fallback for a phone with nothing to clone
// from — screen diagonal is always in the marketing blurb, body mm never is.
const ASPECT_PRESETS = [
  { label: 'iPhone-style (≈19.5:9)', ratio: 19.5 / 9 },
  { label: 'Samsung-style (≈19.3:9)', ratio: 19.3 / 9 },
  { label: 'Tall / ultra (≈20:9)', ratio: 20 / 9 },
  { label: 'Standard (≈16:9)', ratio: 16 / 9 },
];
// Rough linear scale-up from screen size to body size (bezels + chin) — not
// precise, which is why the form keeps height/width editable afterward.
const SCREEN_TO_BODY_RATIO = 0.905;

const slugify = (brand: string, name: string) => {
  const base = `${brand}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const taken = new Set(phoneModels.map((m) => m.id));
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
};

export function AddModelModal({ onClose, onAdded }: { onClose: () => void; onAdded: (model: PhoneModel) => void }) {
  const [brand, setBrand] = useState<'iPhone' | 'Samsung'>('iPhone');
  const [name, setName] = useState('');
  const [heightMm, setHeightMm] = useState('');
  const [widthMm, setWidthMm] = useState('');
  const [cloneFrom, setCloneFrom] = useState('');
  const [estimatorOpen, setEstimatorOpen] = useState(false);
  const [diagonalIn, setDiagonalIn] = useState('6.3');
  const [aspectIdx, setAspectIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyClone = (id: string) => {
    setCloneFrom(id);
    const m = phoneModels.find((p) => p.id === id);
    if (m) { setHeightMm(String(m.heightMm)); setWidthMm(String(m.widthMm)); }
  };

  const applyEstimate = () => {
    const diag = parseFloat(diagonalIn);
    if (!diag || diag <= 0) return;
    const diagMm = diag * 25.4;
    const r = ASPECT_PRESETS[aspectIdx].ratio; // screen height / screen width
    const screenW = diagMm / Math.sqrt(1 + r * r);
    const screenH = screenW * r;
    setWidthMm((screenW / SCREEN_TO_BODY_RATIO).toFixed(1));
    setHeightMm((screenH / SCREEN_TO_BODY_RATIO).toFixed(1));
  };

  const canSave = name.trim().length > 0 && Number(heightMm) > 0 && Number(widthMm) > 0;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    const model: PhoneModel = {
      id: slugify(brand, name.trim()),
      brand,
      name: name.trim(),
      heightMm: Number(heightMm),
      widthMm: Number(widthMm),
    };
    const { error: err } = await addPhoneModel(model);
    setSaving(false);
    if (err) { setError(err); return; }
    onAdded(model);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Add a phone model</h2>
        <p className="modal-sub">New model dropped and it's not in the list yet? Add it here — no code change needed.</p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {(['iPhone', 'Samsung'] as const).map((b) => (
            <button key={b} className={`chip-pick ${brand === b ? 'on' : ''}`} onClick={() => setBrand(b)}>{b}</button>
          ))}
        </div>

        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Model name</label>
        <input className="bg-field" style={{ marginBottom: 14 }} placeholder="e.g. 18 Pro Max" value={name} onChange={(e) => setName(e.target.value)} />

        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Start from a similar model (optional)</label>
        <select className="status" style={{ width: '100%', marginBottom: 14 }} value={cloneFrom} onChange={(e) => applyClone(e.target.value)}>
          <option value="">— pick one to copy its size —</option>
          {phoneModels.map((m) => (
            <option key={m.id} value={m.id}>{m.brand} {m.name} — {m.widthMm}×{m.heightMm}mm</option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Width (mm)</label>
            <input className="bg-field" type="number" step="0.1" value={widthMm} onChange={(e) => setWidthMm(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Height (mm)</label>
            <input className="bg-field" type="number" step="0.1" value={heightMm} onChange={(e) => setHeightMm(e.target.value)} />
          </div>
        </div>

        {!estimatorOpen ? (
          <button className="btn ghost" style={{ marginBottom: 14, width: '100%' }} onClick={() => setEstimatorOpen(true)}>
            Don't know the mm? Estimate from screen size
          </button>
        ) : (
          <div className="notice" style={{ margin: '0 0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span className="page-sub" style={{ margin: 0 }}>
              Rough estimate from the screen diagonal (always on the spec sheet) — adjust the mm above afterward if you can find the real number.
            </span>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Screen diagonal (in)</label>
                <input className="bg-field" type="number" step="0.1" value={diagonalIn} onChange={(e) => setDiagonalIn(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Screen shape</label>
                <select className="status" style={{ width: '100%' }} value={aspectIdx} onChange={(e) => setAspectIdx(Number(e.target.value))}>
                  {ASPECT_PRESETS.map((p, i) => <option key={p.label} value={i}>{p.label}</option>)}
                </select>
              </div>
            </div>
            <button className="btn soft" onClick={applyEstimate}>Fill in width/height from this</button>
          </div>
        )}

        {error && <p style={{ color: 'var(--danger, #e0405a)', fontSize: 13, fontWeight: 700, margin: '0 0 10px' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn cool" disabled={!canSave || saving} onClick={save}>{saving ? 'Adding…' : '+ Add model'}</button>
        </div>
      </div>
    </div>
  );
}
