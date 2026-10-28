"use client";
// Holographic "System" window (Solo Leveling style) and small shared pieces.

/** @param kind  "info" (blue) | "warning" (red) | "gold" */
export default function SysWin({ title, kind = "info", className = "", children, ...rest }) {
    const cls = kind === "warning" ? "is-warning" : kind === "gold" ? "is-gold" : "";
    return (
        <section className={`sys-win keep-dark ${cls} ${className}`} {...rest}>
            {title && <div className="sys-title">{kind === "warning" ? "⚠" : "ⓘ"} {title}</div>}
            {children}
        </section>
    );
}

export function RankEmblem({ rank, size = 34 }) {
    return (
        <span className="rank-emblem" style={{ color: rank.color, width: size, height: size, fontSize: Math.round(size * (rank.id === "N" ? 0.5 : 0.58)) }}
            title={rank.name} aria-label={rank.name}>
            {rank.id === "N" ? "NL" : rank.id}
        </span>
    );
}

export function GoldAmount({ value, size = 15 }) {
    return <span className="gold" style={{ fontSize: size }}>🪙 {Math.floor(Number(value) || 0).toLocaleString()}</span>;
}
