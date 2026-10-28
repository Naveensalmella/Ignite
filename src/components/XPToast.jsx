"use client";
import useAppStore from "@/stores/useAppStore";

// Subscribes to the XP feed only, so a toast never re-renders the rest of the app.
export default function XPToast() {
  const xpEvents = useAppStore(s => s.xpEvents);
  if (!Array.isArray(xpEvents) || xpEvents.length === 0) return null;
  return xpEvents.map((ev, i) => (
    <div key={ev.id ?? i} className={`xp-toast ${ev.amount < 0 ? "pen" : ""}`} role="status" style={{ top: `calc(var(--header-h) + var(--safe-top) + ${12 + i * 46}px)` }}>
      <b>{ev.amount > 0 ? "+" : ""}{ev.amount} XP</b>
      <span>{ev.reason}</span>
    </div>
  ));
}
