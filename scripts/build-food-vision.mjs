// Precomputes the text side of the food photo recognizer: one CLIP embedding per food in
// IGNITE's list, written to public/data/food-vision.json (~350 KB). Without this file the
// recognizer still works, but each phone first downloads the text model too (~65 MB) and builds
// the embeddings itself. Re-run after adding foods:  npm run build:food-vision
// Needs internet access to huggingface.co (model weights are served from *.hf.co).
//
// `--if-stale` (used by `npm run build`, so every deploy) does nothing when the file already matches
// the food list, and never fails the build: if the model can't be downloaded it keeps the old file.
import { registerHooks } from "node:module";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Let Node load the app's modules as the bundler does: "@/…" paths, extensionless imports, JSON.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("@/")) specifier = pathToFileURL(join(root, "src", specifier.slice(2))).href;
    try { return next(specifier, context); } catch (e) {
      if (e.code === "ERR_MODULE_NOT_FOUND" && /^(\.|file:)/.test(specifier) && !/\.\w+$/.test(specifier)) return next(specifier + ".js", context);
      throw e;
    }
  },
  load(url, context, next) {
    return url.endsWith(".json") ? next(url, { ...context, importAttributes: { type: "json" } }) : next(url, context);
  },
});

const { VISION_MODEL, VISION_REVISION, VISION_LABELS, embedLabels, encodeVectors } = await import("../src/lib/foodVisionShared.js");
const out = join(root, "public/data/food-vision.json");
const ifStale = process.argv.includes("--if-stale");

// Fingerprint of everything the file depends on: the model and every label's prompts.
const key = createHash("sha256").update(JSON.stringify([VISION_MODEL, VISION_REVISION, VISION_LABELS])).digest("hex").slice(0, 16);
let current = null;
try { current = JSON.parse(readFileSync(out, "utf8")).key; } catch { /* no file yet */ }
if (ifStale && current === key) {
  console.error("build-food-vision: food-vision.json is up to date");
  process.exit(0);
}

try {
  const { AutoTokenizer, CLIPTextModelWithProjection } = await import("@huggingface/transformers");
  const opts = { revision: VISION_REVISION, dtype: "fp32" };
  const tokenizer = await AutoTokenizer.from_pretrained(VISION_MODEL, opts);
  const textModel = await CLIPTextModelWithProjection.from_pretrained(VISION_MODEL, opts);
  const { matrix, dim } = await embedLabels(tokenizer, textModel, VISION_LABELS, done => process.stderr.write(`\r${done}/${VISION_LABELS.length} labels`));
  writeFileSync(out, JSON.stringify({ ...encodeVectors(VISION_LABELS.map(l => l.name), matrix, dim), key }));
  console.error(`\nwrote ${out} (${VISION_LABELS.length} labels × ${dim})${ifStale ? " — commit it so later deploys can skip this step" : ""}`);
} catch (e) {
  if (!ifStale) throw e;
  console.warn(`build-food-vision: couldn't update food-vision.json (${e.message}); keeping the existing file, so foods added since it was made won't be suggested from photos.`);
}
