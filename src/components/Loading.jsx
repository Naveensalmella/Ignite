"use client";

const SHIMMER_BG = "linear-gradient(90deg, var(--ghost-bg) 25%, var(--ghost-hover) 50%, var(--ghost-bg) 75%)";

// ── Shimmer skeleton block ──
function Skeleton({ width = "100%", height = 14, radius = 8, style = {} }) {
  return (
    <div aria-hidden="true" style={{
      width, height, borderRadius: radius,
      background: SHIMMER_BG,
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s ease-in-out infinite",
      ...style,
    }} />
  );
}

// ── Skeleton card (B6 card) ──
function SkeletonCard({ lines = 3, style = {} }) {
  return (
    <div className="card flex flex-col gap-2" style={style} aria-hidden="true">
      <Skeleton width="40%" height={16} style={{ marginBottom: 4 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? "60%" : "100%"} height={12} />
      ))}
    </div>
  );
}

// ── Full page loading skeleton ──
export function SkeletonPage() {
  return (
    <div className="page fade-in" role="status" aria-label="Loading">
      {/* Hero placeholder */}
      <div className="card flex items-center gap-4" aria-hidden="true">
        <Skeleton width={72} height={72} radius={36} />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton width="45%" height={16} />
          <Skeleton width="70%" height={12} />
          <Skeleton width="30%" height={12} />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3" aria-hidden="true">
        {[1, 2, 3].map(i => (
          <div key={i} className="card flex flex-col items-center gap-2" style={{ padding: 14 }}>
            <Skeleton width={40} height={24} />
            <Skeleton width="60%" height={10} />
          </div>
        ))}
      </div>

      {/* Content cards */}
      <SkeletonCard lines={3} />
      <SkeletonCard lines={2} />

      {/* List card */}
      <div className="card" aria-hidden="true">
        <Skeleton width="35%" height={16} style={{ marginBottom: 10 }} />
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 py-2.5" style={{ borderTop: i > 1 ? "1px solid var(--line)" : "none" }}>
            <Skeleton width={38} height={38} radius={12} />
            <div className="flex-1 flex flex-col gap-1.5">
              <Skeleton width="70%" height={12} />
              <Skeleton width="40%" height={10} />
            </div>
            <Skeleton width={50} height={20} radius={999} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Inline loading spinner ──
export function Spinner({ size = 20, color = "var(--accent)" }) {
  return (
    <div role="status" aria-label="Loading" style={{
      width: size, height: size, border: "2px solid var(--track)",
      borderTopColor: color, borderRadius: "50%",
      animation: "spin .6s linear infinite",
    }} />
  );
}

// ── Loading overlay ──
export function LoadingOverlay({ text = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3" style={{ padding: 40 }}>
      <Spinner size={32} />
      <span className="text-[13px]" style={{ color: "var(--text-dim)" }}>{text}</span>
    </div>
  );
}

export default function Loading() {
  return <SkeletonPage />;
}

export { Skeleton, SkeletonCard };
