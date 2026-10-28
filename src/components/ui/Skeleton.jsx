"use client";

/**
 * Skeleton placeholders for loading states, shaped like B6 cards
 * (radius 20 card surface, var(--ghost-bg) shimmer blocks inside).
 * Uses the shimmer animation already defined in globals.css.
 */

function Shimmer({ className = "", style }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-lg ${className}`}
      style={{
        background: "linear-gradient(90deg, var(--ghost-bg) 25%, var(--ghost-hover) 50%, var(--ghost-bg) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

/** Single skeleton line */
export function SkeletonLine({ width = "w-full", height = "h-3" }) {
  return <Shimmer className={`${width} ${height}`} />;
}

/** Skeleton circle (avatar, ring) */
export function SkeletonCircle({ size = "w-14 h-14" }) {
  return <Shimmer className={`${size} !rounded-full`} />;
}

/** Skeleton card: card surface with two shimmer lines (clipped on short cards) */
export function SkeletonCard({ height = "h-24", className = "" }) {
  return (
    <div aria-hidden="true" className={`card w-full ${height} mb-3 flex flex-col gap-2 overflow-hidden ${className}`} style={{ padding: 14 }}>
      <Shimmer className="h-3 w-2/5 shrink-0" />
      <Shimmer className="h-2.5 w-3/4 shrink-0" />
    </div>
  );
}

/** Dashboard skeleton */
export function DashboardSkeleton() {
  return (
    <div className="page fade-in" role="status" aria-label="Loading">
      {/* Hero card */}
      <div className="card flex items-center gap-4" style={{ minHeight: 150 }} aria-hidden="true">
        <SkeletonCircle size="w-[88px] h-[88px] shrink-0" />
        <div className="flex-1 flex flex-col gap-2.5">
          <Shimmer className="h-6 w-2/5 !rounded-full" />
          <Shimmer className="h-3 w-3/5" />
          <Shimmer className="h-3 w-1/3" />
        </div>
      </div>

      {/* Daily Quest card */}
      <div className="card flex flex-col gap-3" aria-hidden="true">
        <Shimmer className="h-4 w-1/3" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <SkeletonCircle size="w-6 h-6 shrink-0" />
            <div className="flex-1 flex flex-col gap-1.5">
              <Shimmer className="h-3 w-1/2" />
              <Shimmer className="h-1.5 w-full !rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Shortcut tiles */}
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <SkeletonCard key={i} height="h-20" className="!mb-0" />
        ))}
      </div>

      {/* Stats */}
      <SkeletonCard height="h-24" className="!mb-0" />
    </div>
  );
}

/** Training skeleton */
export function TrainingSkeleton() {
  return (
    <div className="page fade-in" role="status" aria-label="Loading">
      {/* Weekly goal */}
      <SkeletonCard height="h-24" className="!mb-0" />

      {/* Challenge carousel */}
      <div className="flex gap-3 overflow-hidden">
        <SkeletonCard height="h-[200px]" className="!mb-0 !w-[85%] shrink-0" />
        <SkeletonCard height="h-[200px]" className="!mb-0 !w-[85%] shrink-0" />
      </div>

      {/* Body focus chips */}
      <div className="flex flex-wrap gap-2">
        {[...Array(6)].map((_, i) => (
          <Shimmer key={i} className="h-9 w-20 !rounded-full" />
        ))}
      </div>

      {/* Programs */}
      <SkeletonCard height="h-32" className="!mb-0" />
      <SkeletonCard height="h-32" className="!mb-0" />
    </div>
  );
}

/** Nutrition skeleton */
export function NutritionSkeleton() {
  return (
    <div className="page fade-in" role="status" aria-label="Loading">
      {/* Calorie ring */}
      <div className="card flex items-center gap-4" style={{ minHeight: 150 }} aria-hidden="true">
        <SkeletonCircle size="w-[92px] h-[92px] shrink-0" />
        <div className="flex-1 flex flex-col gap-2.5">
          <Shimmer className="h-4 w-1/2" />
          <Shimmer className="h-1.5 w-full !rounded-full" />
          <Shimmer className="h-1.5 w-full !rounded-full" />
          <Shimmer className="h-1.5 w-full !rounded-full" />
        </div>
      </div>

      {/* Tab bar */}
      <Shimmer className="h-11 w-full !rounded-full" />

      {/* Meal cards */}
      <SkeletonCard height="h-20" className="!mb-0" />
      <SkeletonCard height="h-20" className="!mb-0" />
      <SkeletonCard height="h-20" className="!mb-0" />
    </div>
  );
}

/** Generic page loader (used by React.lazy Suspense) */
export default function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-label="Loading">
      <div className="text-center">
        <div className="w-8 h-8 rounded-full mx-auto mb-3"
          style={{ border: "2px solid var(--track)", borderTopColor: "var(--accent)", animation: "spin .8s linear infinite" }} />
        <div className="text-xs" style={{ color: "var(--text-dim)" }}>Loading...</div>
      </div>
    </div>
  );
}
