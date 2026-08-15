"use client";

/**
 * Glass-style card container (replaces inline className="gs" usage)
 */
export default function Card({ children, style, className = "", onClick, padding = "p-4", mb = "mb-[14px]", ...rest }) {
  return (
    <div
      className={`gs ${padding} ${mb} ${onClick ? "cursor-pointer" : ""} ${className}`.trim()}
      onClick={onClick}
      style={style}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * Small stat display card (replaces inline className="gc" stat boxes)
 */
export function StatCard({ value, label, color = "text-emerald-500", icon, onClick, className = "" }) {
  return (
    <div
      className={`gc p-[14px] text-center ${onClick ? "cursor-pointer" : ""} ${className}`.trim()}
      onClick={onClick}
    >
      {icon && <div className="text-xl mb-1">{icon}</div>}
      <div className={`text-[22px] font-black font-heading ${color}`}>
        {value}
      </div>
      <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}
