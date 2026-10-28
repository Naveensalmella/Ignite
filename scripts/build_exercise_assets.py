#!/usr/bin/env python3
"""Build exercise visual assets from free-exercise-db (public domain, Unlicense).

  python3 scripts/build_exercise_assets.py

- Downloads the dataset index at a pinned commit.
- Writes public/data/exercise-catalog.json (all exercises, compact).
- Vendors start/end photos (resized WebP) for every dataset id referenced in
  src/data/exerciseVisualMap.json into public/exercises/<id>/{0,1}.webp, so the
  exercises used in workouts load from our own domain and work offline.
Other catalog images are loaded from GitHub's CDN at the same pinned commit.
Requires Pillow.
"""
import io, json, os, sys, urllib.request
from PIL import Image

SHA = "f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5"
RAW = f"https://raw.githubusercontent.com/yuhonas/free-exercise-db/{SHA}"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAP = os.path.join(ROOT, "src/data/exerciseVisualMap.json")
OUT_IMG = os.path.join(ROOT, "public/exercises")
OUT_CATALOG = os.path.join(ROOT, "public/data/exercise-catalog.json")
MAX_W = 480


def fetch(url):
    with urllib.request.urlopen(url, timeout=60) as r:
        return r.read()


def main():
    data = json.loads(fetch(f"{RAW}/dist/exercises.json"))
    vmap = json.load(open(MAP))
    vendored = sorted({v["id"] for v in vmap.values() if v.get("id")})
    by_id = {e["id"]: e for e in data}

    for i, ex_id in enumerate(vendored, 1):
        ex = by_id[ex_id]
        dest = os.path.join(OUT_IMG, ex_id)
        os.makedirs(dest, exist_ok=True)
        for n, rel in enumerate(ex["images"][:2]):
            out = os.path.join(dest, f"{n}.webp")
            if os.path.exists(out):
                continue
            img = Image.open(io.BytesIO(fetch(f"{RAW}/exercises/{rel}"))).convert("RGB")
            if img.width > MAX_W:
                img = img.resize((MAX_W, round(img.height * MAX_W / img.width)), Image.LANCZOS)
            img.save(out, "WEBP", quality=72, method=6)
        print(f"[{i}/{len(vendored)}] {ex_id}", file=sys.stderr)

    vset = set(vendored)
    catalog = [{
        "id": e["id"], "name": e["name"], "level": e.get("level"), "equipment": e.get("equipment"),
        "category": e.get("category"), "mechanic": e.get("mechanic"), "force": e.get("force"),
        "primary": e.get("primaryMuscles") or [], "secondary": e.get("secondaryMuscles") or [],
        "instructions": e.get("instructions") or [], "imgs": len(e.get("images") or []),
        **({"v": 1} if e["id"] in vset else {}),
    } for e in data]
    os.makedirs(os.path.dirname(OUT_CATALOG), exist_ok=True)
    with open(OUT_CATALOG, "w") as f:
        json.dump({"sha": SHA, "exercises": catalog}, f, separators=(",", ":"), ensure_ascii=False)
    print(f"catalog: {len(catalog)} exercises, vendored images for {len(vendored)}", file=sys.stderr)


if __name__ == "__main__":
    main()
