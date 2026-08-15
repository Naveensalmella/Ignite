"use client";

/**
 * Chip/tab selector row (replaces repeated chip-a/chip-i toggle patterns)
 *
 * @param {object} props
 * @param {Array<{key: string, label: string}>} props.options - Chip options
 * @param {string} props.active - Currently active key
 * @param {function} props.onChange - Called with the selected key
 * @param {object} [props.style] - Container style overrides
 * @param {object} [props.chipStyle] - Per-chip style overrides
 * @param {number} [props.gap=6] - Gap between chips
 * @param {number} [props.mb=16] - Margin bottom
 */
export default function ChipSelector({ options, active, onChange, style, chipStyle, gap = 6, mb = 16 }) {
  return (
    <div
      style={{
        display: "flex",
        gap,
        marginBottom: mb,
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
        ...style,
      }}
    >
      {options.map(opt => (
        <span
          key={opt.key}
          className={`chip ${active === opt.key ? "chip-a" : "chip-i"}`}
          onClick={() => onChange(opt.key)}
          style={{ flexShrink: 0, fontSize: 12, ...chipStyle }}
        >
          {opt.label}
        </span>
      ))}
    </div>
  );
}
