"use client";

/**
 * Chip/tab selector row (replaces repeated chip-a/chip-i toggle patterns)
 */
export default function ChipSelector({ options, active, onChange, className = "", chipClassName = "", gap = "gap-1.5", mb = "mb-4" }) {
  return (
    <div className={`flex ${gap} ${mb} overflow-x-auto no-scrollbar ${className}`.trim()}>
      {options.map(opt => (
        <span
          key={opt.key}
          className={`chip shrink-0 text-xs ${active === opt.key ? "chip-a" : "chip-i"} ${chipClassName}`.trim()}
          onClick={() => onChange(opt.key)}
        >
          {opt.label}
        </span>
      ))}
    </div>
  );
}
