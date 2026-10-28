"use client";
// ══════════════════════════════════════════════════════════════
// MoveFigure — animated SVG athlete that demonstrates a movement.
// A tiny forward-kinematics skeleton: each pattern (figurePatterns.js)
// is a few keyframes of joint angles; frames are blended with easing,
// the figure is auto-placed on the floor (or hung from a bar), and the
// working body parts are drawn in the accent colour.
// ══════════════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from "react";
import { PATTERNS } from "./figurePatterns";

const SEG = { torso: 30, neck: 4, head: 6.5, upper: 14, fore: 13, thigh: 17, shin: 17, foot: 5 };
const GROUND = 0;
const BAR_Y = -100;
const KEYS = ["t", "h", "ua", "fa", "ub", "fb", "tf", "sf", "tb", "sb", "kf", "kb", "air", "dx", "breath", "rope"];

const rad = (a) => (a * Math.PI) / 180;
const dir = (a) => [Math.sin(rad(a)), Math.cos(rad(a))];
const add = (p, a, len) => { const [x, y] = dir(a); return [p[0] + x * len, p[1] + y * len]; };
const ease = (x) => 0.5 - Math.cos(Math.PI * x) / 2;

// Fill every key so frames can be blended numerically.
function normalize(frame, pattern) {
    const front = pattern.view === "front";
    const f = { t: 180, h: 0, ua: 6, fa: 8, ub: -6, fb: -4, tf: 3, sf: 0, tb: -3, sb: 0, air: 0, dx: 0, breath: 0, rope: 0, ...frame };
    if (pattern.sym) {
        if (frame.ub === undefined) f.ub = -f.ua;
        if (frame.fb === undefined) f.fb = -f.fa;
        if (frame.tb === undefined) f.tb = -f.tf;
        if (frame.sb === undefined) f.sb = -f.sf;
    }
    if (f.kf === undefined) f.kf = front ? f.sf + 75 : f.sf + 90;
    if (f.kb === undefined) f.kb = front ? f.sb - 75 : f.sb + 90;
    return f;
}

// Joint positions for a pose (before floor placement).
function solve(p, pattern) {
    const front = pattern.view === "front";
    const H = [p.dx, 0];
    const S = add(H, p.t, SEG.torso);
    const head = add(S, p.t + p.h, SEG.neck + SEG.head);
    const [tx, ty] = dir(p.t);
    const perp = front ? [-ty, tx] : [0, 0]; // shoulder/hip width only in front view
    const off = (pt, k) => [pt[0] + perp[0] * k, pt[1] + perp[1] * k];
    const sF = off(S, 7), sB = off(S, -7), hF = off(H, 4), hB = off(H, -4);
    const elbF = add(sF, p.ua, SEG.upper), handF = add(elbF, p.fa, SEG.fore);
    const elbB = add(sB, p.ub, SEG.upper), handB = add(elbB, p.fb, SEG.fore);
    const kneeF = add(hF, p.tf, SEG.thigh), ankF = add(kneeF, p.sf, SEG.shin), toeF = add(ankF, p.kf, SEG.foot);
    const kneeB = add(hB, p.tb, SEG.thigh), ankB = add(kneeB, p.sb, SEG.shin), toeB = add(ankB, p.kb, SEG.foot);
    return { H, S, head, sF, sB, hF, hB, elbF, handF, elbB, handB, kneeF, ankF, toeF, kneeB, ankB, toeB };
}

// Place the skeleton: on the floor, or hanging from a bar by the hands.
function place(j, p, pattern) {
    let shift;
    if (pattern.anchor === "hands") {
        shift = BAR_Y - Math.min(j.handF[1], j.handB[1]);
    } else {
        const pts = [j.ankF, j.ankB, j.toeF, j.toeB, j.kneeF, j.kneeB, j.handF, j.handB, j.H, j.S, [0, j.head[1] + SEG.head]];
        shift = GROUND - Math.max(...pts.map((q) => q[1])) - p.air;
    }
    const out = {};
    for (const [k, v] of Object.entries(j)) out[k] = [v[0], v[1] + shift];
    return out;
}

function poseAt(frames, timeMs) {
    const total = frames.reduce((s, f) => s + (f.d || 600), 0);
    let t = ((timeMs % total) + total) % total;
    for (let i = 0; i < frames.length; i++) {
        const d = frames[i].d || 600;
        if (t <= d) {
            const a = frames[i], b = frames[(i + 1) % frames.length];
            const k = ease(t / d);
            const out = {};
            for (const key of KEYS) out[key] = a[key] + (b[key] - a[key]) * k;
            return out;
        }
        t -= d;
    }
    return frames[0];
}

// Bounding box over the whole loop so the figure never jumps around in its frame.
function computeBox(frames, pattern) {
    const total = frames.reduce((s, f) => s + (f.d || 600), 0);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let t = 0; t <= total; t += Math.max(20, total / 60)) {
        const p = poseAt(frames, t);
        const j = place(solve(p, pattern), p, pattern);
        for (const [x, y] of Object.values(j)) {
            minX = Math.min(minX, x); maxX = Math.max(maxX, x);
            minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
    }
    minY -= SEG.head + 2;
    if (pattern.anchor === "hands") minY = Math.min(minY, BAR_Y - 6);
    maxY = Math.max(maxY, pattern.anchor === "hands" ? maxY : GROUND);
    const w = maxX - minX, h = maxY - minY;
    const size = Math.max(w, h) + 22;
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    return { x: cx - size / 2, y: cy - size / 2, size, floor: GROUND };
}

const prefersReducedMotion = () =>
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * @param pattern   key from figurePatterns (falls back to "stand")
 * @param animate   play the loop (paused automatically when off-screen)
 * @param frame     keyframe shown when not animating (default: the pattern's key position)
 * @param speed     playback speed multiplier
 * @param accent    colour for working body parts
 */
export default function MoveFigure({ pattern = "stand", animate = true, frame, speed = 1, size = "100%", accent = "var(--fig-accent)", className = "", title }) {
    const def = PATTERNS[pattern] || PATTERNS.stand;
    const frames = useMemo(() => def.frames.map((f) => normalize(f, def)), [def]);
    const box = useMemo(() => computeBox(frames, def), [frames, def]);
    const stillIdx = Math.min(frame ?? def.still ?? 1, frames.length - 1);
    const stillTime = useMemo(() => frames.slice(0, stillIdx).reduce((s, f) => s + (f.d || 600), 0), [frames, stillIdx]);

    const [time, setTime] = useState(stillTime);
    const ref = useRef(null);
    const visible = useRef(false);

    useEffect(() => {
        if (!animate || prefersReducedMotion()) return;
        const el = ref.current;
        let raf = 0, last = performance.now(), t = stillTime;
        const loop = (now) => {
            const dt = Math.min(100, now - last);
            last = now;
            if (visible.current) { t += dt * speed; setTime(t); }
            raf = requestAnimationFrame(loop);
        };
        const io = new IntersectionObserver(([e]) => { visible.current = e.isIntersecting; }, { threshold: 0.05 });
        if (el) io.observe(el); else visible.current = true;
        raf = requestAnimationFrame(loop);
        return () => { cancelAnimationFrame(raf); io.disconnect(); };
    }, [animate, speed, stillTime]);

    const p = poseAt(frames, animate ? time : stillTime);
    const j = place(solve(p, def), p, def);
    const focus = new Set(def.focus?.includes("full") ? ["arms", "legs", "core"] : def.focus || []);
    const col = (part) => (focus.has(part) ? accent : "var(--fig-body)");
    const front = def.view === "front";
    const props = new Set(def.props || []);
    const line = (a, b, part, w = 5.5, back = false) => (
        <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={col(part)} strokeWidth={w} strokeLinecap="round" opacity={back && !front ? 0.45 : 1} />
    );
    const dumbbell = (hand, fore) => {
        const [dx, dy] = dir(fore + 90);
        return <line x1={hand[0] - dx * 5} y1={hand[1] - dy * 5} x2={hand[0] + dx * 5} y2={hand[1] + dy * 5} stroke="var(--fig-prop)" strokeWidth={4.5} strokeLinecap="round" />;
    };

    const midX = (j.ankF[0] + j.ankB[0]) / 2;

    return (
        <svg ref={ref} viewBox={`${box.x} ${box.y} ${box.size} ${box.size}`} width={size} height={size} className={className}
            role="img" aria-label={title || `${pattern.replace(/_/g, " ")} demonstration`} style={{ display: "block", overflow: "visible" }}>
            {/* floor */}
            {def.anchor !== "hands" && (
                <>
                    {props.has("mat") && <rect x={box.x + box.size * 0.08} y={box.floor - 1} width={box.size * 0.84} height={3} rx={1.5} fill="var(--fig-accent)" opacity={0.25} />}
                    <ellipse cx={midX} cy={box.floor + 1.5} rx={Math.min(box.size * 0.32, 26)} ry={2.4} fill="var(--fig-shadow)" />
                    <line x1={box.x + 4} y1={box.floor + 1.5} x2={box.x + box.size - 4} y2={box.floor + 1.5} stroke="var(--fig-ground)" strokeWidth={1} />
                </>
            )}
            {props.has("wall") && <line x1={j.H[0] - 6} y1={box.floor} x2={j.H[0] - 6} y2={box.floor - 70} stroke="var(--fig-prop)" strokeWidth={3} strokeLinecap="round" opacity={0.6} />}
            {props.has("bar") && <line x1={j.handF[0] - 26} y1={BAR_Y - 1} x2={j.handF[0] + 26} y2={BAR_Y - 1} stroke="var(--fig-prop)" strokeWidth={3.5} strokeLinecap="round" />}
            {props.has("bars") && <line x1={j.handF[0] - 14} y1={BAR_Y + 2} x2={j.handF[0] + 14} y2={BAR_Y + 2} stroke="var(--fig-prop)" strokeWidth={3.5} strokeLinecap="round" />}
            {props.has("rope") && (() => {
                // Seen from the side the rope traces a loop around the athlete.
                const cx = j.H[0] + 3, cy = (j.head[1] - SEG.head - 6 + box.floor + 2) / 2;
                const rx = 17, ry = (box.floor + 2 - (j.head[1] - SEG.head - 6)) / 2;
                const a = ((animate ? time : 0) / 440) * Math.PI * 2;
                const arc = (t0) => [cx + rx * Math.sin(t0), cy - ry * Math.cos(t0)];
                const [x0, y0] = arc(a - 0.5), [x1, y1] = arc(a + 0.5);
                return (
                    <g>
                        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="var(--fig-prop)" strokeWidth={1} opacity={0.3} />
                        <path d={`M ${x0} ${y0} A ${rx} ${ry} 0 0 1 ${x1} ${y1}`} fill="none" stroke="var(--fig-accent)" strokeWidth={2.2} strokeLinecap="round" />
                    </g>
                );
            })()}
            {props.has("breath") && <circle cx={(j.S[0] + j.H[0]) / 2} cy={(j.S[1] + j.H[1]) / 2} r={10 + p.breath * 9} fill="var(--fig-accent)" opacity={0.08 + p.breath * 0.1} />}

            {/* back limbs (dimmed in side view) */}
            {line(j.sB, j.elbB, "arms", 5, true)}{line(j.elbB, j.handB, "arms", 5, true)}
            {line(j.hB, j.kneeB, "legs", 6, true)}{line(j.kneeB, j.ankB, "legs", 5.5, true)}{line(j.ankB, j.toeB, "legs", 3.5, true)}
            {props.has("dumbbells") && dumbbell(j.handB, p.fb)}

            {/* torso + head */}
            {front ? (
                <path d={`M ${j.sB[0]} ${j.sB[1]} L ${j.sF[0]} ${j.sF[1]} L ${j.hF[0]} ${j.hF[1]} L ${j.hB[0]} ${j.hB[1]} Z`} fill={col("core")} stroke={col("core")} strokeWidth={4} strokeLinejoin="round" />
            ) : line(j.H, j.S, "core", 8)}
            <line x1={j.S[0]} y1={j.S[1]} x2={(j.S[0] + j.head[0]) / 2} y2={(j.S[1] + j.head[1]) / 2} stroke="var(--fig-body)" strokeWidth={4} strokeLinecap="round" />
            <circle cx={j.head[0]} cy={j.head[1]} r={SEG.head} fill="var(--fig-body)" />

            {/* front limbs */}
            {line(j.hF, j.kneeF, "legs", 6)}{line(j.kneeF, j.ankF, "legs", 5.5)}{line(j.ankF, j.toeF, "legs", 3.5)}
            {line(j.sF, j.elbF, "arms", 5)}{line(j.elbF, j.handF, "arms", 5)}
            {props.has("dumbbells") && dumbbell(j.handF, p.fa)}
            {props.has("barbell") && <circle cx={j.handF[0]} cy={j.handF[1]} r={7} fill="none" stroke="var(--fig-prop)" strokeWidth={3} />}
        </svg>
    );
}
