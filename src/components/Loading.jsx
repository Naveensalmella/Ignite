"use client";

// ── Shimmer skeleton line ──
function Skeleton({ width = "100%", height = 14, radius = 6, style = {} }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: "linear-gradient(90deg, rgba(255,255,255,.03) 25%, rgba(255,255,255,.06) 50%, rgba(255,255,255,.03) 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s infinite",
      ...style,
    }} />
  );
}

// ── Skeleton card (glass style) ──
function SkeletonCard({ lines = 3, style = {} }) {
  return (
    <div className="gs" style={{ padding: 16, marginBottom: 12, ...style }}>
      <Skeleton width="40%" height={16} style={{ marginBottom: 12 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? "60%" : "100%"} height={12} style={{ marginBottom: 8 }} />
      ))}
    </div>
  );
}

// ── Full page loading skeleton ──
export function SkeletonPage() {
  return (
    <div style={{ padding: 16, animation: "fadeIn .3s ease-out" }}>
      {/* Header skeleton */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <Skeleton width={48} height={48} radius={24} />
        <div style={{ flex: 1 }}>
          <Skeleton width="50%" height={16} style={{ marginBottom: 6 }} />
          <Skeleton width="30%" height={10} />
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="gs" style={{ padding: 14, textAlign: "center" }}>
            <Skeleton width={40} height={28} radius={6} style={{ margin: "0 auto 8px" }} />
            <Skeleton width="60%" height={10} style={{ margin: "0 auto" }} />
          </div>
        ))}
      </div>

      {/* Content cards */}
      <SkeletonCard lines={3} />
      <SkeletonCard lines={2} />
      <SkeletonCard lines={4} />

      {/* List items */}
      {[1, 2, 3].map(i => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,.03)" }}>
          <Skeleton width={36} height={36} radius={10} />
          <div style={{ flex: 1 }}>
            <Skeleton width="70%" height={12} style={{ marginBottom: 6 }} />
            <Skeleton width="40%" height={10} />
          </div>
          <Skeleton width={50} height={20} radius={10} />
        </div>
      ))}
    </div>
  );
}

// ── Inline loading spinner ──
export function Spinner({ size = 20, color = "#10b981" }) {
  return (
    <div style={{
      width: size, height: size, border: `2px solid rgba(255,255,255,.06)`,
      borderTopColor: color, borderRadius: "50%",
      animation: "spin .6s linear infinite",
    }} />
  );
}

// ── Loading overlay ──
export function LoadingOverlay({ text = "Loading..." }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, gap: 12 }}>
      <Spinner size={32} />
      <span style={{ fontSize: 13, color: "#6b7280" }}>{text}</span>
    </div>
  );
}

export default function Loading() {
  return <SkeletonPage />;
}

export { Skeleton, SkeletonCard };