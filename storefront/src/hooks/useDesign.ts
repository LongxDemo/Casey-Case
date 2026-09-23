import { useState } from 'react';
import { backgrounds } from '../mock';
import { aspectOf, CANVAS_BASE, MODELS } from '../lib/types';
import type { CaseBackground, Design, Layer, Template } from '../lib/types';

let counter = 0;
const uid = (p = 'l') => `${p}_${Date.now().toString(36)}_${(counter++).toString(36)}`;

function blankDesign(modelId: string): Design {
  return { id: uid('d'), modelId, background: backgrounds[5], layers: [] };
}

function fromTemplate(t: Template, modelId: string): Design {
  return {
    id: uid('d'),
    modelId,
    background: t.background,
    layers: t.layers.map((l, i) => ({ ...l, id: uid(), z: l.z ?? i + 1 })) as Layer[],
  };
}

const nextZ = (layers: Layer[]) => (layers.length ? Math.max(...layers.map((l) => l.z)) + 1 : 1);

export function useDesign(initialModelId: string) {
  const [design, setDesign] = useState<Design>(() => blankDesign(initialModelId));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Transient UI state, deliberately not a field on the layer itself — a
  // saved/duplicated/templated design should never come back "stuck" in
  // adjust mode.
  const [adjustFrameId, setAdjustFrameId] = useState<string | null>(null);

  const startBlank = (modelId?: string) => {
    setDesign(blankDesign(modelId ?? design.modelId));
    setSelectedId(null);
    setAdjustFrameId(null);
  };
  const startFromTemplate = (t: Template, modelId?: string) => {
    setDesign(fromTemplate(t, modelId ?? design.modelId));
    setSelectedId(null);
    setAdjustFrameId(null);
  };
  const setModel = (modelId: string) => setDesign((d) => ({ ...d, modelId }));
  const setBackground = (bg: CaseBackground) => setDesign((d) => ({ ...d, background: bg }));
  const select = (id: string | null) => {
    setSelectedId(id);
    setAdjustFrameId((a) => (a === id ? a : null));
  };
  const enterAdjustMode = (id: string) => setAdjustFrameId(id);
  const exitAdjustMode = () => setAdjustFrameId(null);

  const addSticker = (emoji: string) => {
    const layer: Layer = { id: uid(), kind: 'sticker', emoji, size: 64, tx: 0, ty: 0, scale: 1, rotation: 0, z: nextZ(design.layers) };
    setDesign((d) => ({ ...d, layers: [...d.layers, layer] }));
    setSelectedId(layer.id);
  };
  const addText = (text = 'Tap to edit') => {
    const layer: Layer = { id: uid(), kind: 'text', text, color: '#FFFFFF', fontSize: 30, fontWeight: '800', align: 'center', tx: 0, ty: 0, scale: 1, rotation: 0, z: nextZ(design.layers) };
    setDesign((d) => ({ ...d, layers: [...d.layers, layer] }));
    setSelectedId(layer.id);
  };
  const addImage = (uri: string, width: number, height: number) => {
    const maxW = 160;
    const ratio = height / width;
    const w = Math.min(width, maxW);
    const layer: Layer = { id: uid(), kind: 'image', uri, width: w, height: w * ratio, radius: 12, tx: 0, ty: 0, scale: 1, rotation: 0, z: nextZ(design.layers) };
    setDesign((d) => ({ ...d, layers: [...d.layers, layer] }));
    setSelectedId(layer.id);
  };
  // On-demand "Fit to Case" action (button-triggered, not automatic on
  // upload) — resizes+recenters the layer to cover the full case edge to
  // edge. LayerView renders images with objectFit: 'cover', so this center-
  // crops rather than stretching/distorting the original photo.
  const fitImageToCase = (id: string) => {
    const model = MODELS[design.modelId] ?? Object.values(MODELS)[0];
    const canvasH = CANVAS_BASE / aspectOf(model);
    updateLayer(id, { width: CANVAS_BASE, height: canvasH, radius: 0, tx: 0, ty: 0, scale: 1, rotation: 0 });
  };
  const addFrame = (frameId: string) => {
    const layer: Layer = {
      id: uid(), kind: 'frame', frameId, photoUri: null, photoTx: 0, photoTy: 0, photoScale: 1,
      tx: 0, ty: 0, scale: 1, rotation: 0, z: nextZ(design.layers),
    };
    setDesign((d) => ({ ...d, layers: [...d.layers, layer] }));
    setSelectedId(layer.id);
  };
  const setFramePhoto = (id: string, uri: string) =>
    setDesign((d) => ({
      ...d,
      layers: d.layers.map((l) => (l.id === id && l.kind === 'frame' ? { ...l, photoUri: uri, photoTx: 0, photoTy: 0, photoScale: 1 } : l)),
    }));
  const updateLayer = (id: string, patch: Partial<Layer>) =>
    setDesign((d) => ({ ...d, layers: d.layers.map((l) => (l.id === id ? ({ ...l, ...patch } as Layer) : l)) }));
  const removeLayer = (id: string) => {
    setDesign((d) => ({ ...d, layers: d.layers.filter((l) => l.id !== id) }));
    setSelectedId((s) => (s === id ? null : s));
    setAdjustFrameId((a) => (a === id ? null : a));
  };
  const duplicateLayer = (id: string) => {
    const src = design.layers.find((l) => l.id === id);
    if (!src) return;
    const copy = { ...src, id: uid(), tx: src.tx + 20, ty: src.ty + 20, z: nextZ(design.layers) } as Layer;
    setDesign((d) => ({ ...d, layers: [...d.layers, copy] }));
    setSelectedId(copy.id);
  };
  const bringToFront = (id: string) =>
    setDesign((d) => ({ ...d, layers: d.layers.map((l) => (l.id === id ? { ...l, z: nextZ(d.layers) } : l)) }));

  return {
    design, selectedId, adjustFrameId, startBlank, startFromTemplate, setModel, setBackground, select,
    enterAdjustMode, exitAdjustMode,
    addSticker, addText, addImage, fitImageToCase, addFrame, setFramePhoto, updateLayer, removeLayer, duplicateLayer, bringToFront,
  };
}
