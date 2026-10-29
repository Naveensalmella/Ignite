// Copies ONNX Runtime's WebAssembly engine (used by the on-device food photo recognizer) into
// public/vendor/ort/<version>/, so it loads from our own site and the service worker keeps it
// offline. Runs after `npm install`; if it can't, the recognizer falls back to the jsDelivr CDN.
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const FILES = ["ort-wasm-simd-threaded.mjs", "ort-wasm-simd-threaded.wasm"];

try {
  // The copy Transformers.js imports (nested if npm couldn't hoist it).
  const dir = [join(root, "node_modules/@huggingface/transformers/node_modules/onnxruntime-web"), join(root, "node_modules/onnxruntime-web")].find(d => existsSync(join(d, "package.json")));
  if (!dir) throw new Error("onnxruntime-web is not installed");
  const { version } = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  const out = join(root, "public/vendor/ort", version);
  mkdirSync(out, { recursive: true });
  for (const f of FILES) copyFileSync(join(dir, "dist", f), join(out, f));
  console.log(`copy-ort-wasm: ONNX Runtime ${version} → public/vendor/ort/${version}/`);
} catch (e) {
  console.warn(`copy-ort-wasm: skipped (${e.message}); the photo recognizer will load it from the CDN.`);
}
