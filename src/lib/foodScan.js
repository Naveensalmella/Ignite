// Browser-side food scanning: photo/description/lookup via /api/food-scan, barcode
// lookups via Open Food Facts (free, no key), and a small on-device cache so the
// same photo, meal or barcode never costs a second AI call.
import { aiJson } from "@/lib/aiClient";

// ── Cache (localStorage, newest first, capped) ──
const CACHE_KEY = "ignite-food-cache";
const CACHE_MAX = 120;
const readCache = () => { try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}"); } catch { return {}; } };
function cacheGet(key) { const c = readCache()[key]; return c && Date.now() - c.t < 30 * 864e5 ? c.v : null; }
function cachePut(key, v) {
  try {
    const all = readCache();
    all[key] = { t: Date.now(), v };
    const keys = Object.keys(all).sort((a, b) => all[b].t - all[a].t);
    for (const k of keys.slice(CACHE_MAX)) delete all[k];
    localStorage.setItem(CACHE_KEY, JSON.stringify(all));
  } catch { /* storage full or blocked: caching is optional */ }
}
const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
async function sha(text) {
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].slice(0, 12).map(b => b.toString(16).padStart(2, "0")).join("");
  } catch { return ""; }
}

// ── Images ──
/** Load any image the browser can decode and re-encode it as a JPEG ≤ maxSide px. */
export function prepareImage(src, maxSide = 1024, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * ratio));
      canvas.height = Math.max(1, Math.round(img.height * ratio));
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff"; // transparent PNGs would turn black in JPEG
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("This photo format can't be read here. Please use a JPG or PNG photo (on iPhone: Settings → Camera → Formats → Most Compatible)."));
    img.src = src;
  });
}

/** Read a picked File as a data URL. */
export function readFile(file) {
  return new Promise((resolve, reject) => {
    if (file.size > 25 * 1024 * 1024) { reject(new Error("That photo is too large (over 25 MB).")); return; }
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error("Couldn't read that photo. Please try another one."));
    r.readAsDataURL(file);
  });
}

// ── Is AI set up on the server? (optional — everything else works without it) ──
const AI_KEY = "ignite-food-ai";
export function aiKnown() { try { const v = localStorage.getItem(AI_KEY); return v === null ? null : v === "1"; } catch { return null; } }
export async function checkAI() {
  try {
    const r = await fetch("/api/food-scan", { signal: AbortSignal.timeout(8000) });
    const { ai } = await r.json();
    try { localStorage.setItem(AI_KEY, ai ? "1" : "0"); } catch { /* optional */ }
    return !!ai;
  } catch { return aiKnown() ?? false; }
}

// ── AI calls (cached) ──
async function cachedAI(key, body, signal) {
  const hit = key && cacheGet(key);
  if (hit) return { foods: hit, cached: true };
  const data = await aiJson("/api/food-scan", body, { signal });
  if (data.foods?.length && key) cachePut(key, data.foods);
  return data;
}

export async function scanPhoto(jpegDataUrl, signal) {
  return cachedAI(`img:${await sha(jpegDataUrl)}`, { image: jpegDataUrl }, signal);
}
export async function describeMeal(text, signal) {
  return cachedAI(`meal:${norm(text)}`, { description: text }, signal);
}
/** Per-100 g nutrition for a food name that isn't in the built-in list. */
export async function lookupFood(query, signal) {
  const data = await cachedAI(`look:${norm(query)}`, { lookup: query }, signal);
  return { ...data, foods: (data.foods || []).map(f => ({ ...f, category: "AI lookup", source: "ai" })) };
}

// ── Barcodes (Open Food Facts) ──
const r1 = (v) => Math.round((Number(v) || 0) * 10) / 10;

/** Look up a packaged food by barcode. Returns { food } per 100 g, or { error }. */
export async function lookupBarcode(code) {
  const clean = String(code || "").replace(/\D/g, "");
  if (clean.length < 8 || clean.length > 14) return { error: "That doesn't look like a barcode number (8–14 digits)." };
  const hit = cacheGet(`bar:${clean}`);
  if (hit) return { food: hit };
  if (typeof navigator !== "undefined" && navigator.onLine === false) return { error: "You're offline. Connect to look up barcodes." };
  try {
    const fields = "product_name,product_name_en,brands,nutriments,serving_quantity,serving_size";
    const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${clean}.json?fields=${fields}`, { signal: AbortSignal.timeout(15000) });
    const data = await r.json().catch(() => ({}));
    const p = data?.product;
    if (!r.ok || data.status === 0 || !p) return { error: "Product not found. Try scanning the food itself, or add it as a custom food.", code: clean };
    const nu = p.nutriments || {};
    const kcal = nu["energy-kcal_100g"] ?? (nu["energy_100g"] ? nu["energy_100g"] / 4.184 : null);
    if (kcal == null) return { error: "This product has no nutrition info yet. Add it as a custom food from the label.", code: clean };
    const name = [p.product_name || p.product_name_en, p.brands?.split(",")[0]].filter(Boolean).join(" · ").slice(0, 80) || `Product ${clean}`;
    const food = {
      name, emoji: "📦", category: "Packaged", source: "barcode", barcode: clean,
      cal: Math.round(kcal), protein: r1(nu.proteins_100g), carbs: r1(nu.carbohydrates_100g), fat: r1(nu.fat_100g), fiber: r1(nu.fiber_100g),
      servingGrams: Number(p.serving_quantity) > 0 ? Math.round(Number(p.serving_quantity)) : null,
    };
    cachePut(`bar:${clean}`, food);
    return { food };
  } catch {
    return { error: "Couldn't reach the product database. Check your connection and try again.", code: clean };
  }
}

const BARCODE_FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e"];
/** The browser's BarcodeDetector, or a WebAssembly one (loaded only when needed). */
export async function getBarcodeDetector() {
  if (typeof window !== "undefined" && "BarcodeDetector" in window) {
    try {
      const supported = await window.BarcodeDetector.getSupportedFormats();
      const formats = BARCODE_FORMATS.filter(f => supported.includes(f));
      if (formats.length) return new window.BarcodeDetector({ formats });
    } catch { /* fall through to the WebAssembly detector */ }
  }
  // WebAssembly fallback (iPhone, Firefox). The .wasm is served from /public so it
  // doesn't depend on a CDN; if that copy is missing the library's CDN default is used.
  const { BarcodeDetector, prepareZXingModule, ZXING_WASM_VERSION } = await import("barcode-detector/ponyfill");
  const local = `/vendor/zxing/${ZXING_WASM_VERSION}/zxing_reader.wasm`;
  if (await fetch(local, { method: "HEAD" }).then(r => r.ok).catch(() => false)) {
    prepareZXingModule({ overrides: { locateFile: (path, prefix) => path.endsWith(".wasm") ? local : prefix + path } });
  }
  const detector = new BarcodeDetector({ formats: BARCODE_FORMATS });
  const probe = document.createElement("canvas"); probe.width = probe.height = 8;
  await detector.detect(probe); // throws now (not on every frame) if the engine can't load
  return detector;
}
