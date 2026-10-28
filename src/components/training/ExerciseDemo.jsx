"use client";
// Visual demonstration of an exercise: start/end photos that crossfade to
// show the motion, or the animated figure when no photo exists (or fails).
import { useEffect, useState } from "react";
import MoveFigure from "./MoveFigure";

export default function ExerciseDemo({ info, animate = true, rounded = 16, height = "100%", showBadge = true, interval = 1100, fit = "cover" }) {
    const frames = info?.frames;
    const [failed, setFailed] = useState(false);
    const [phase, setPhase] = useState(1);
    const usePhoto = frames && !failed;

    useEffect(() => {
        if (!usePhoto || !animate) return;
        const id = setInterval(() => setPhase(p => (p ? 0 : 1)), interval);
        return () => clearInterval(id);
    }, [usePhoto, animate, interval]);

    const box = { position: "relative", width: "100%", height, borderRadius: rounded, overflow: "hidden" };

    if (!usePhoto) {
        return (
            <div style={{ ...box, background: "var(--demo-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: "86%", height: "86%" }}>
                    <MoveFigure pattern={info?.pattern || "stand"} animate={animate} title={`${info?.name || "Exercise"} demonstration`} />
                </div>
            </div>
        );
    }

    const shown = animate ? phase : 1;
    return (
        <div style={{ ...box, background: "#fff" }}>
            {frames.map((src, i) => (
                <img key={src} src={src} alt={i === 0 ? `${info.name} — start position` : `${info.name} — end position`}
                    loading="lazy" decoding="async" draggable={false} onError={() => setFailed(true)}
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: fit, transition: "opacity .45s ease", opacity: (i === 1 ? shown : 1) }} />
            ))}
            {showBadge && animate && (
                <div style={{ position: "absolute", left: 8, bottom: 8, display: "flex", gap: 4 }}>
                    {["Start", "End"].map((l, i) => (
                        <span key={l} style={{ fontSize: 10, fontWeight: 700, padding: "3px 7px", borderRadius: 999, background: (shown === i) ? "rgba(16,185,129,.95)" : "rgba(0,0,0,.45)", color: "#fff", transition: "background .3s" }}>{l}</span>
                    ))}
                </div>
            )}
        </div>
    );
}
