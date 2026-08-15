"use client";

/**
 * Glass-style card container (replaces inline className="gs" usage)
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {object} [props.style] - Additional inline styles
 * @param {string} [props.className] - Extra CSS classes
 * @param {function} [props.onClick] - Click handler
 * @param {number} [props.padding=16] - Padding in px
 * @param {number} [props.mb=14] - Margin-bottom in px (0 to disable)
 */
export default function Card({ children, style, className = "", onClick, padding = 16, mb = 14, ...rest }) {
  return (
    <div
      className={`gs ${className}`.trim()}
      onClick={onClick}
      style={{
        padding,
        marginBottom: mb || undefined,
        cursor: onClick ? "pointer" : undefined,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * Small stat display card (replaces inline className="gc" stat boxes)
 *
 * @param {object} props
 * @param {string} props.value - The main stat value
 * @param {string} props.label - Small label below value
 * @param {string} [props.color="#10b981"] - Value text color
 * @param {string} [props.icon] - Optional emoji/icon above value
 * @param {function} [props.onClick] - Click handler
 * @param {object} [props.style] - Additional inline styles
 */
export function StatCard({ value, label, color = "#10b981", icon, onClick, style }) {
  return (
    <div
      className="gc"
      onClick={onClick}
      style={{
        padding: 14,
        textAlign: "center",
        cursor: onClick ? "pointer" : undefined,
        ...style,
      }}
    >
      {icon && <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>}
      <div style={{ fontSize: 22, fontWeight: 900, color, fontFamily: "Rajdhani,sans-serif" }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{label}</div>
    </div>
  );
}
