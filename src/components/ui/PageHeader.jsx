"use client";

/**
 * Consistent page/section header (replaces repeated h2 + subtitle pattern)
 */
export default function PageHeader({ title, subtitle, action, mb = "mb-4", className = "" }) {
  return (
    <div className={`flex justify-between items-center ${mb} ${className}`.trim()}>
      <div>
        <h2 className="text-[22px] font-extrabold text-gray-100 font-heading m-0">
          {title}
        </h2>
        {subtitle && (
          <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
