"use client";
// ══════════════════════════════════════════════════════════════
// BodyMap — front & back anatomical muscle map.
// Highlights primary / secondary muscles, or paints each muscle with a
// custom colour (used for the recovery heat-map).
// Right-side shapes are drawn once and mirrored for the left side.
// ══════════════════════════════════════════════════════════════
import { MUSCLE_LABELS } from "@/lib/muscles";

// Silhouette (right half is mirrored)
const SIL = {
    torso: "M40 34 C32 36 27 38 27 46 C28 58 31 70 33 82 C34 92 33 100 32 108 L68 108 C67 100 66 92 67 82 C69 70 72 58 73 46 C73 38 68 36 60 34 Z",
    arm: "M72 40 C79 42 81 52 80 62 C81 75 82 90 81 104 C80 112 78 118 76 124 C73 125 71 123 71 120 C70 108 69 92 69 80 C69 70 69 58 70 50 Z",
    leg: "M50 108 L68 108 C71 122 70 140 66 158 C66 172 66 188 62 202 L61 208 L54 208 C55 196 55 182 55 168 C53 150 51 130 50 108 Z",
};

// [muscle, path, mirrored?]
const FRONT = [
    ["neck", "M45 26 L55 26 L56 35 L44 35 Z", false],
    ["traps", "M55 31 C60 35 66 36 71 38 L61 40 C58 38 56 35 55 31 Z", true],
    ["shoulders", "M60 37 C68 35 76 38 77 47 C77 52 75 55 72 56 C69 50 65 45 60 42 Z", true],
    ["chest", "M51 42 C56 40 64 41 69 47 C70 52 68 58 62 60 C57 61 52 59 51 56 Z", true],
    ["biceps", "M71 57 C75 58 78 64 78 72 C77 77 74 79 71 77 C69 71 69 63 71 57 Z", true],
    ["forearms", "M72 81 C77 81 80 88 80 98 C79 106 77 112 75 114 L71 113 C70 104 70 92 72 81 Z", true],
    ["abdominals", "M43 62 L57 62 C58 75 58 90 56 104 C53 107 47 107 44 104 C42 90 42 75 43 62 Z", false],
    ["abdominals", "M58 63 C63 63 66 68 66 76 C66 86 63 96 58 102 C58 88 59 74 58 63 Z", true],
    ["abductors", "M64 104 C68 106 70 112 69 121 C67 117 64 112 61 108 Z", true],
    ["quadriceps", "M52 112 C58 110 66 112 69 123 C70 136 67 150 62 160 C58 161 55 158 54 152 C52 140 51 126 52 112 Z", true],
    ["adductors", "M50 110 C52 118 53 130 53 144 C51 140 50 128 50 110 Z", true],
    ["calves", "M56 168 C60 166 65 168 65 178 C65 190 62 198 59 200 C57 196 56 188 56 168 Z", true],
];

const BACK = [
    ["neck", "M45 26 L55 26 L56 33 L44 33 Z", false],
    ["traps", "M50 30 C54 34 62 36 70 39 C64 44 58 50 50 60 C42 50 36 44 30 39 C38 36 46 34 50 30 Z", false],
    ["shoulders", "M62 37 C69 35 76 38 77 47 C77 52 75 55 72 56 C69 50 66 45 62 41 Z", true],
    ["triceps", "M70 56 C74 57 78 63 78 72 C77 78 74 80 71 79 C69 72 69 63 70 56 Z", true],
    ["forearms", "M72 82 C77 82 80 89 80 99 C79 107 77 112 75 114 L71 113 C70 104 70 93 72 82 Z", true],
    ["lats", "M60 50 C66 46 71 50 70 58 C68 70 64 82 57 92 C56 80 56 66 60 50 Z", true],
    ["middle back", "M50 60 C55 54 57 52 59 52 C57 62 55 72 52 78 L48 78 C45 72 43 62 41 52 C43 52 45 54 50 60 Z", false],
    ["lower back", "M44 81 L56 81 C57 90 57 98 56 104 L44 104 C43 98 43 90 44 81 Z", false],
    ["glutes", "M50 106 C58 104 67 106 68 116 C69 124 64 130 57 130 C52 130 50 126 50 120 Z", true],
    ["hamstrings", "M52 132 C58 131 65 132 67 141 C67 150 64 158 60 162 C57 162 54 158 53 150 C52 144 52 138 52 132 Z", true],
    ["calves", "M56 166 C61 164 66 168 66 178 C66 188 62 196 59 198 C57 192 55 184 56 166 Z", true],
];

const mirror = "translate(100 0) scale(-1 1)";

function Figure({ shapes, fill, title }) {
    return (
        <svg viewBox="0 0 100 212" style={{ width: "100%", height: "100%", display: "block" }} role="img" aria-label={title}>
            <ellipse cx="50" cy="15" rx="8.5" ry="10.5" fill="var(--bm-base)" />
            {["torso", "arm", "leg"].map(k => (
                <g key={k}>
                    <path d={SIL[k]} fill="var(--bm-base)" />
                    {k !== "torso" && <path d={SIL[k]} fill="var(--bm-base)" transform={mirror} />}
                </g>
            ))}
            {shapes.map(([m, d, mir], i) => {
                const f = fill(m);
                return (
                    <g key={i}>
                        <path d={d} fill={f.color} opacity={f.opacity} stroke="var(--bm-line)" strokeWidth={0.6}><title>{MUSCLE_LABELS[m] || m}</title></path>
                        {mir && <path d={d} transform={mirror} fill={f.color} opacity={f.opacity} stroke="var(--bm-line)" strokeWidth={0.6}><title>{MUSCLE_LABELS[m] || m}</title></path>}
                    </g>
                );
            })}
        </svg>
    );
}

/**
 * @param primary    muscles worked most (accent)
 * @param secondary  supporting muscles (accent, lighter)
 * @param colors     { muscle: cssColor } — overrides primary/secondary (recovery map)
 * @param views      "both" | "front" | "back"
 */
export default function BodyMap({ primary = [], secondary = [], colors = null, views = "both", height = 180, accent = "var(--accent)", labels = true }) {
    const p = new Set(primary), s = new Set(secondary);
    const fill = (m) => {
        if (colors) return colors[m] ? { color: colors[m], opacity: 0.9 } : { color: "var(--bm-muscle)", opacity: 1 };
        if (p.has(m)) return { color: accent, opacity: 1 };
        if (s.has(m)) return { color: accent, opacity: 0.42 };
        return { color: "var(--bm-muscle)", opacity: 1 };
    };
    const show = views === "both" ? ["front", "back"] : [views];
    return (
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            {show.map(v => (
                <div key={v} style={{ textAlign: "center" }}>
                    <div style={{ height, aspectRatio: "100 / 212" }}>
                        <Figure shapes={v === "front" ? FRONT : BACK} fill={fill} title={`${v} view muscles`} />
                    </div>
                    {labels && <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4, textTransform: "uppercase", letterSpacing: 1 }}>{v}</div>}
                </div>
            ))}
        </div>
    );
}
