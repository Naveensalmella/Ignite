"use client";

export default function XPToast({ xpEvents = [] }) {
  if (!Array.isArray(xpEvents)) return null;
  return xpEvents.map((ev, i) => (
    <div key={ev.id ?? i} className={`xp-toast ${ev.amount < 0 ? "pen" : ""}`} style={{ top: `${80 + i * 40}px` }}>
      {ev.amount > 0 ? "+" : ""}{ev.amount} XP{" "}
      <span style={{ fontSize: 13, color: ev.amount > 0 ? "#fb923c" : "#ef4444", fontWeight: 500 }}>{ev.reason}</span>
    </div>
  ));
}
