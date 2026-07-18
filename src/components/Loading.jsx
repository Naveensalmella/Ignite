// Shimmer loading skeletons — use while data loads
const shimmer = {
  background: "linear-gradient(90deg, rgba(255,255,255,.03) 25%, rgba(255,255,255,.06) 50%, rgba(255,255,255,.03) 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.5s infinite",
  borderRadius: 8,
};

export function SkeletonLine({ width = "100%", height = 14, style = {} }) {
  return <div style={{ ...shimmer, width, height, ...style }} />;
}

export function SkeletonCard({ height = 120, style = {} }) {
  return (
    <div style={{ ...shimmer, height, borderRadius: 16, ...style }} />
  );
}

export function SkeletonPage() {
  return (
    <div style={{ padding: "20px 0" }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <SkeletonLine width="40%" height={24} style={{ marginBottom: 8 }} />
      <SkeletonLine width="60%" height={14} style={{ marginBottom: 20 }} />
      <SkeletonCard height={140} style={{ marginBottom: 12 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <SkeletonCard height={90} />
        <SkeletonCard height={90} />
      </div>
      <SkeletonCard height={100} style={{ marginBottom: 10 }} />
      <SkeletonCard height={80} />
    </div>
  );
}

export default function Loading({ type = "page" }) {
  if (type === "card") return <SkeletonCard />;
  if (type === "line") return <SkeletonLine />;
  return <SkeletonPage />;
}