"use client";

/**
 * Skeleton shimmer placeholder for loading states.
 * Uses the shimmer animation already defined in globals.css.
 */

function Shimmer({ className = "", style }) {
  return (
    <div
      className={`rounded-xl ${className}`}
      style={{
        background: "linear-gradient(90deg, rgba(255,255,255,.03) 25%, rgba(255,255,255,.06) 50%, rgba(255,255,255,.03) 75%)",
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

/** Skeleton card (glass-style placeholder) */
export function SkeletonCard({ height = "h-24", className = "" }) {
  return <Shimmer className={`w-full ${height} mb-[14px] ${className}`} />;
}

/** Dashboard skeleton */
export function DashboardSkeleton() {
  return (
    <div className="max-w-full overflow-x-hidden animate-fade-in">
      {/* Hero card */}
      <SkeletonCard height="h-44" />

      {/* Activity grid */}
      <div className="grid grid-cols-3 gap-2 mb-[14px]">
        <SkeletonCard height="h-20" className="!mb-0" />
        <SkeletonCard height="h-20" className="!mb-0" />
        <SkeletonCard height="h-20" className="!mb-0" />
      </div>

      {/* XP row */}
      <SkeletonCard height="h-20" />

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-2 mb-[14px]">
        {[...Array(4)].map((_, i) => (
          <SkeletonCard key={i} height="h-16" className="!mb-0" />
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-[14px]">
        <SkeletonCard height="h-16" className="!mb-0" />
        <SkeletonCard height="h-16" className="!mb-0" />
        <SkeletonCard height="h-16" className="!mb-0" />
      </div>

      {/* Score card */}
      <SkeletonCard height="h-20" />
    </div>
  );
}

/** Training skeleton */
export function TrainingSkeleton() {
  return (
    <div className="max-w-full overflow-x-hidden animate-fade-in">
      {/* Weekly goal */}
      <SkeletonCard height="h-24" />

      {/* Challenge carousel */}
      <div className="flex gap-3 mb-5">
        <SkeletonCard height="h-[220px]" className="!mb-0 !w-[85%] shrink-0" />
        <SkeletonCard height="h-[220px]" className="!mb-0 !w-[85%] shrink-0" />
      </div>

      {/* Body focus */}
      <SkeletonCard height="h-10" />
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[...Array(8)].map((_, i) => (
          <SkeletonCard key={i} height="h-10" className="!mb-0 !rounded-full" />
        ))}
      </div>

      {/* Programs */}
      <SkeletonCard height="h-32" />
      <SkeletonCard height="h-32" />
    </div>
  );
}

/** Nutrition skeleton */
export function NutritionSkeleton() {
  return (
    <div className="max-w-full overflow-x-hidden animate-fade-in">
      {/* Calorie ring */}
      <SkeletonCard height="h-40" />

      {/* Macro bars */}
      <div className="grid grid-cols-3 gap-2 mb-[14px]">
        <SkeletonCard height="h-16" className="!mb-0" />
        <SkeletonCard height="h-16" className="!mb-0" />
        <SkeletonCard height="h-16" className="!mb-0" />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1.5 mb-4">
        {[...Array(5)].map((_, i) => (
          <Shimmer key={i} className="h-8 w-20 !rounded-full" />
        ))}
      </div>

      {/* Meal cards */}
      <SkeletonCard height="h-20" />
      <SkeletonCard height="h-20" />
      <SkeletonCard height="h-20" />
    </div>
  );
}

/** Generic page loader (used by React.lazy Suspense) */
export default function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full mx-auto mb-3" style={{ animation: "spin .8s linear infinite" }} />
        <div className="text-xs text-gray-500">Loading...</div>
      </div>
    </div>
  );
}
