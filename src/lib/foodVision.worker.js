// On-device food photo recognizer (runs in a Web Worker so the page stays smooth).
// MobileCLIP compares the photo with a text description of every food in IGNITE's list and
// returns the closest matches. The model downloads from Hugging Face once, then is served from
// the browser cache, so photos work offline and never leave the device.
import { env, AutoProcessor, AutoTokenizer, CLIPTextModelWithProjection, CLIPVisionModelWithProjection, RawImage } from "@huggingface/transformers";
import { VISION_MODEL, VISION_REVISION, VISION_LABELS, embedLabels, encodeVectors, decodeVectors } from "@/lib/foodVisionShared";

env.allowLocalModels = false;
env.useWasmCache = false; // the app's service worker already keeps /vendor/ offline

const PRECOMPUTED = "/data/food-vision.json";
const LOCAL_CACHE = "ignite-food-vision"; // embeddings computed on this device (when the file above is missing)
const USDA_PENALTY = 1; // logits; on a near-tie prefer our own dishes over generic USDA foods
const NAMES = VISION_LABELS.map(l => l.name);
const usda = new Set(VISION_LABELS.filter(l => l.usda).map(l => l.name));

let ready = null;
const post = (msg) => self.postMessage(msg);

// Download progress, summed over every file being fetched.
const files = new Map();
const onProgress = (p) => {
  if (p.status !== "progress" || !p.total) return;
  files.set(p.file, [p.loaded, p.total]);
  let loaded = 0, total = 0;
  for (const [l, t] of files.values()) { loaded += l; total += t; }
  post({ type: "progress", stage: "download", loaded, total });
};

// Prefer our own copy of ONNX Runtime's WebAssembly (scripts/copy-ort-wasm.mjs); else the library's CDN default.
async function pickRuntime() {
  const v = env.backends.onnx?.versions?.web;
  if (!v || !env.backends.onnx.wasm) return;
  const base = new URL(`/vendor/ort/${v}/`, self.location.origin).href;
  if (await fetch(base + "ort-wasm-simd-threaded.wasm", { method: "HEAD" }).then(r => r.ok).catch(() => false)) {
    env.backends.onnx.wasm.wasmPaths = { mjs: base + "ort-wasm-simd-threaded.mjs", wasm: base + "ort-wasm-simd-threaded.wasm" };
  }
}

async function readJson(url, cache) {
  try {
    const r = cache ? await (await caches.open(cache)).match(url) : await fetch(url);
    return r && r.ok ? await r.json() : null;
  } catch { return null; }
}

// Text side: the shipped file, else one computed earlier on this device, else compute it now (once).
async function loadLabels() {
  const hit = decodeVectors(await readJson(PRECOMPUTED), NAMES) || decodeVectors(await readJson(PRECOMPUTED, LOCAL_CACHE), NAMES);
  if (hit) return hit;
  const opts = { revision: VISION_REVISION, device: "wasm", dtype: "q8", progress_callback: onProgress };
  const [tokenizer, textModel] = await Promise.all([AutoTokenizer.from_pretrained(VISION_MODEL, opts), CLIPTextModelWithProjection.from_pretrained(VISION_MODEL, opts)]);
  const { matrix, dim } = await embedLabels(tokenizer, textModel, VISION_LABELS, done => post({ type: "progress", stage: "prepare", loaded: done, total: VISION_LABELS.length }));
  await textModel.dispose?.();
  const file = encodeVectors(NAMES, matrix, dim);
  try { await (await caches.open(LOCAL_CACHE)).put(PRECOMPUTED, new Response(JSON.stringify(file), { headers: { "Content-Type": "application/json" } })); } catch { /* recomputed next time */ }
  return decodeVectors(file, NAMES);
}

async function init() {
  await pickRuntime();
  // fp16 halves the download and matches fp32 on our test photos (the 8-bit version is broken for this model).
  const opts = { revision: VISION_REVISION, device: "wasm", dtype: "fp16", progress_callback: onProgress };
  const [processor, model] = await Promise.all([AutoProcessor.from_pretrained(VISION_MODEL, opts), CLIPVisionModelWithProjection.from_pretrained(VISION_MODEL, opts)]);
  const labels = await loadLabels();
  return { processor, model, labels };
}

async function classify(image, top) {
  ready ||= init().catch(e => { ready = null; throw e; });
  const { processor, model, labels } = await ready;
  post({ type: "progress", stage: "look" });
  const { image_embeds } = await model(await processor(await RawImage.read(image)));
  const v = image_embeds.normalize().data;
  const { names, matrix, dim } = labels;
  // Cosine similarity × CLIP's logit scale (100), then softmax over every label.
  const logits = new Float32Array(names.length);
  let max = -Infinity;
  for (let i = 0; i < names.length; i++) {
    let s = 0;
    for (let j = 0; j < dim; j++) s += v[j] * matrix[i * dim + j];
    logits[i] = 100 * s - (usda.has(names[i]) ? USDA_PENALTY : 0);
    max = Math.max(max, logits[i]);
  }
  let sum = 0;
  for (let i = 0; i < logits.length; i++) sum += (logits[i] = Math.exp(logits[i] - max));
  const order = [...logits.keys()].sort((a, b) => logits[b] - logits[a]);
  return order.slice(0, top).map(i => ({ name: names[i], p: logits[i] / sum }));
}

self.onmessage = async ({ data }) => {
  if (data?.type !== "classify") return;
  try {
    post({ type: "result", id: data.id, matches: await classify(data.image, data.top || 8) });
  } catch (e) {
    post({ type: "error", id: data.id, message: String(e?.message || e) });
  }
};
