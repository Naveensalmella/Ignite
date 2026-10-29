// Photo recognizer, shared parts: which foods it picks from, how each one is described to it,
// and the compact format of the food embeddings. Used by the in-browser recognizer
// (foodVision.worker.js) and by scripts/build-food-vision.mjs, which precomputes the text side
// into public/data/food-vision.json so phones only download the image half of the model.
import { FOOD_DATABASE } from "@/data/foodDatabase";

// OpenAI's CLIP ViT-B/32 (zero-shot image ↔ text matching; MIT licence), ONNX weights for Transformers.js.
// (Apple's MobileCLIP scored a little better but its weights are licensed for research only.)
// Pinned to one revision so the precomputed food embeddings always match the weights.
export const VISION_MODEL = "Xenova/clip-vit-base-patch32";
export const VISION_REVISION = "6b7c523703ae26e39be4b03774966f8571c7f523";

// Things you cook with rather than photograph as a meal.
const NOT_A_DISH = /\b(powder|peel|syrup|sugar|whey|isolate)\b|\boil$|\bflour\b(?! tortilla)|^egg (white|yolk|\(raw\))/i;
// USDA lists ~60 fish species that look the same on a plate; keep the ones people can tell apart.
const KNOWN_SEAFOOD = /tuna|salmon|sardine|shrimp|crab|lobster|squid|mussel|oyster|\bcod\b|tilapia|trout/i;
const visible = (f) => !NOT_A_DISH.test(f.name) && (f.source !== "USDA" || f.category !== "Fish & Seafood" || KNOWN_SEAFOOD.test(f.name));

/** Foods the recognizer chooses between (each name once). */
export const VISION_FOODS = (() => {
  const seen = new Set();
  return FOOD_DATABASE.filter(f => {
    const k = f.name.toLowerCase();
    if (seen.has(k) || !visible(f)) return false;
    seen.add(k);
    return true;
  });
})();

// Non-food labels, so a photo of a person or a room says "no food" instead of naming a dish.
// Their names start with "#" and are never shown.
const NOT_FOOD = ["a person", "a face", "a person exercising", "gym equipment", "a room", "a pet", "a car", "a landscape", "a screenshot", "a page of text", "an empty plate"];

const prompt = (s) => `a photo of ${s}, a type of food.`;

/** Every label with its text prompts: a food's name plus its first other name (dahi, chapati…). */
export const VISION_LABELS = [
  ...VISION_FOODS.map(f => {
    const other = (f.aka || []).find(a => a.toLowerCase() !== f.name.toLowerCase());
    return { name: f.name, usda: f.source === "USDA", prompts: other ? [prompt(f.name), prompt(other)] : [prompt(f.name)] };
  }),
  ...NOT_FOOD.map(x => ({ name: `#${x}`, prompts: [`a photo of ${x}.`] })),
];

/**
 * Text embedding for each label (the mean of its prompts, unit length), as one Float32Array
 * of labels.length × dim. `onBatch(done)` reports progress.
 */
export async function embedLabels(tokenizer, textModel, labels, onBatch) {
  const out = [];
  let dim = 0;
  for (let i = 0; i < labels.length; i += 32) {
    const batch = labels.slice(i, i + 32);
    const texts = batch.flatMap(l => l.prompts);
    const { text_embeds } = await textModel(tokenizer(texts, { padding: "max_length", truncation: true }));
    dim = text_embeds.dims[1];
    const all = text_embeds.normalize().data;
    let row = 0;
    for (const l of batch) {
      const v = new Float32Array(dim);
      for (let p = 0; p < l.prompts.length; p++, row++) for (let j = 0; j < dim; j++) v[j] += all[row * dim + j];
      out.push(unit(v));
    }
    onBatch?.(Math.min(labels.length, i + 32));
  }
  const matrix = new Float32Array(out.length * dim);
  out.forEach((v, i) => matrix.set(v, i * dim));
  return { matrix, dim };
}

function unit(v) {
  let s = 0;
  for (const x of v) s += x * x;
  const n = Math.sqrt(s) || 1;
  for (let j = 0; j < v.length; j++) v[j] /= n;
  return v;
}

// ── Stored format: { model, revision, dim, names, vectors } with each row scaled to int8 ──
// (ranking only needs directions, so each row is re-normalised after loading).
export function encodeVectors(names, matrix, dim) {
  const q = new Int8Array(names.length * dim);
  for (let i = 0; i < names.length; i++) {
    let max = 0;
    for (let j = 0; j < dim; j++) max = Math.max(max, Math.abs(matrix[i * dim + j]));
    for (let j = 0; j < dim; j++) q[i * dim + j] = Math.round((matrix[i * dim + j] / (max || 1)) * 127);
  }
  const bytes = new Uint8Array(q.buffer);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return { model: VISION_MODEL, revision: VISION_REVISION, dim, names, vectors: btoa(bin) };
}

/** Rows for `wanted` names (in that order) from a stored file; names it doesn't have are left out. */
export function decodeVectors(file, wanted) {
  if (!file || file.model !== VISION_MODEL || file.revision !== VISION_REVISION || !file.dim || !Array.isArray(file.names)) return null;
  const bin = atob(file.vectors || "");
  const q = new Int8Array(bin.length);
  for (let i = 0; i < bin.length; i++) q[i] = (bin.charCodeAt(i) << 24) >> 24;
  const { dim } = file;
  if (q.length !== file.names.length * dim) return null;
  const at = new Map(file.names.map((n, i) => [n, i]));
  const names = wanted.filter(n => at.has(n));
  const matrix = new Float32Array(names.length * dim);
  names.forEach((n, r) => {
    const i = at.get(n);
    matrix.set(unit(Float32Array.from(q.subarray(i * dim, (i + 1) * dim))), r * dim);
  });
  return { names, matrix, dim };
}
