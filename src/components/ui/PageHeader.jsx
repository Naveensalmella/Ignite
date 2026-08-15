"use client";

/**
 * Consistent page/section header (replaces repeated h2 + subtitle pattern)
 *
 * @param {object} props
 * @param {string} props.title - Page title (may include emoji prefix)
 * @param {string} [props.subtitle] - Optional subtitle text
 * @param {React.ReactNode} [props.action] - Optional right-side action (button, etc.)
 * @param {number} [props.mb=16] - Margin bottom
 * @param {object} [props.style] - Additional style overrides
 */
export default function PageHeader({ title, subtitle, action, mb = 16, style }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: mb,
        ...style,
      }}
    >
      <div>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#f3f4f6",
            fontFamily: "Rajdhani,sans-serif",
            margin: 0,
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{subtitle}</div>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
