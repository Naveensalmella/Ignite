// Browser side of the on-device photo recognizer (see foodVision.worker.js): no AI key, no
// server, and once the model is downloaded it works offline.
import { VISION_FOODS } from "@/lib/foodVisionShared";

const READY_KEY = "ignite-food-vision"; // "1" once the model has run here (so it's cached)
const BY_NAME = new Map(VISION_FOODS.map(f => [f.name, f]));

let worker = null, seq = 0;
const pending = new Map(); // id → { resolve, onProgress }

export const visionSupported = () => typeof Worker !== "undefined" && typeof WebAssembly === "object";
export function visionReady() { try { return localStorage.getItem(READY_KEY) === "1"; } catch { return false; } }

function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL("./foodVision.worker.js", import.meta.url), { type: "module" });
  worker.onmessage = ({ data }) => {
    if (data.type === "progress") { for (const p of pending.values()) p.onProgress?.(data); return; }
    const p = pending.get(data.id);
    if (!p) return;
    pending.delete(data.id);
    p.resolve(data);
  };
  worker.onerror = (e) => {
    for (const p of pending.values()) p.resolve({ type: "error", message: e.message || "The photo recognizer stopped." });
    pending.clear();
    worker.terminate(); worker = null;
  };
  return worker;
}

// Several USDA entries can be the same food ("Broccoli (Raw)", "Broccoli (Boiled)"); show the best one.
const baseName = (f) => f.name.replace(/\s*[(,].*$/, "").toLowerCase();

/**
 * Recognize the food in a photo (a data URL). Resolves to { matches: [{ food, p }] } best first,
 * { error } (with noFood: true when the photo shows no food), or { cancelled }.
 * `onProgress({ stage, loaded, total })` reports the one-time download ("download"), on-device
 * setup ("prepare") and analysis ("look").
 */
export function recognizeFood(image, { onProgress, signal, top = 5 } = {}) {
  if (!visionSupported()) return Promise.resolve({ error: "This browser can't run the photo recognizer." });
  return new Promise((resolve) => {
    const id = ++seq;
    const finish = (r) => { pending.delete(id); resolve(r); };
    signal?.addEventListener("abort", () => finish({ cancelled: true }), { once: true });
    pending.set(id, {
      onProgress,
      resolve: (data) => {
        if (data.type === "error") {
          const offline = typeof navigator !== "undefined" && navigator.onLine === false;
          return finish({ error: offline && !visionReady()
            ? "The photo recognizer downloads once (about 45 MB) the first time. Connect to the internet, then it works offline."
            : "Couldn't run the photo recognizer. Check your connection and try again, or describe your meal.", detail: data.message });
        }
        try { localStorage.setItem(READY_KEY, "1"); } catch { /* optional */ }
        if (data.matches[0]?.name.startsWith("#")) return finish({ noFood: true, error: "No food found in this photo. Try a closer photo of the plate in good light, or describe your meal." });
        const seen = new Set(), matches = [];
        for (const m of data.matches) {
          const food = BY_NAME.get(m.name);
          if (!food || (food.source === "USDA" && seen.has(baseName(food)))) continue;
          seen.add(baseName(food));
          matches.push({ food, p: m.p });
        }
        finish({ matches: matches.slice(0, top) });
      },
    });
    getWorker().postMessage({ type: "classify", id, image, top: top * 3 });
  });
}
