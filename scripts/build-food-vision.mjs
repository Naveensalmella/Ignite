// Precomputes the text side of the food photo recognizer: one MobileCLIP embedding per food in
// IGNITE's list, written to public/data/food-vision.json (~350 KB). Without this file the
// recognizer still works, but each phone first downloads the text model too (~43 MB) and builds
// the embeddings itself. Re-run after adding foods:  npm run build:food-vision
// Needs internet access to huggingface.co (model weights are served from *.hf.co).
import { registerHooks } from "node:module";
import { writeFileSync } from "node:fs";
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
const { AutoTokenizer, CLIPTextModelWithProjection } = await import("@huggingface/transformers");

const opts = { revision: VISION_REVISION, dtype: "fp32" };
const tokenizer = await AutoTokenizer.from_pretrained(VISION_MODEL, opts);
const textModel = await CLIPTextModelWithProjection.from_pretrained(VISION_MODEL, opts);
const { matrix, dim } = await embedLabels(tokenizer, textModel, VISION_LABELS, done => process.stderr.write(`\r${done}/${VISION_LABELS.length} labels`));
const file = encodeVectors(VISION_LABELS.map(l => l.name), matrix, dim);
const out = join(root, "public/data/food-vision.json");
writeFileSync(out, JSON.stringify(file));
console.error(`\nwrote ${out} (${VISION_LABELS.length} labels × ${dim})`);
