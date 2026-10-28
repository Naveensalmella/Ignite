"use client";

export default function XPToast({ xpEvents = [] }) {
  if (!Array.isArray(xpEvents)) return null;
  return xpEvents.map((ev, i) => (
    <div key={ev.id ?? i} className={`xp-toast ${ev.amount < 0 ? "pen" : ""}`} style={{ top: `calc(var(--header-h) + var(--safe-top) + ${12 + i * 46}px)` }}>
      <b>{ev.amount > 0 ? "+" : ""}{ev.amount} XP</b>
      <span>{ev.reason}</span>
    </div>
  ));
}
