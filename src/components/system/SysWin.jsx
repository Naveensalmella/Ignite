"use client";
// The holographic Solo Leveling "System" window — used only for special pop-ups
// (level-up, rank-up, quest complete, ARISE, penalty, awakening). Pages use ui/kit Card.
import { Coins } from "lucide-react";

/** @param kind  "info" (blue) | "warning" (red) | "gold" | "violet" */
export default function SysWin({ title, kind = "info", className = "", children, ...rest }) {
    const cls = kind === "warning" ? "is-warning" : kind === "gold" ? "is-gold" : kind === "violet" ? "is-violet" : "";
    return (
        <section className={`sys-holo ${cls} ${className}`} {...rest}>
            {title && <div className="sys-title">{kind === "warning" ? "⚠" : "ⓘ"} {title}</div>}
            {children}
        </section>
    );
}

/** Hunter rank badge (E…S, NL). */
export function RankEmblem({ rank, size = 34 }) {
    return (
        <span className="rank-emblem" style={{ color: rank.color, width: size, height: size, fontSize: Math.round(size * (rank.id === "N" ? 0.42 : 0.5)) }}
            title={rank.name} aria-label={rank.name}>
            {rank.id === "N" ? "NL" : rank.id}
        </span>
    );
}

export function GoldAmount({ value, size = 15 }) {
    return <span className="gold" style={{ fontSize: size }}><Coins size={Math.round(size * 1.05)} strokeWidth={2.2} aria-hidden="true" />{Math.floor(Number(value) || 0).toLocaleString()}</span>;
}
