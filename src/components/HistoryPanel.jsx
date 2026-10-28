"use client";
// ═══════════════════════════════════════
// IGNITE — PhonePe-Style History Panel
// Reusable date-grouped, expandable history view
// ═══════════════════════════════════════
import { useState } from 'react';
import { today as todayKey, addDays, parseDateKey } from '@/utils';

// Format date into human labels
function formatDateLabel(dateStr) {
    if (typeof dateStr !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr === "unknown" ? "Undated" : String(dateStr || "Undated");
    const d = parseDateKey(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    // Day keys are LOCAL dates (see today()/dateKey in utils)
    const today = todayKey();
    const yStr = addDays(-1, today);

    if (dateStr === today) return "Today";
    if (dateStr === yStr) return "Yesterday";

    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays < 7) return d.toLocaleDateString('en', { weekday: 'long' });

    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: now.getFullYear() !== d.getFullYear() ? 'numeric' : undefined });
}

/*
  Props:
  entries: [{
    date: "2025-07-14",
    icon: "⚔️",
    title: "Push Day Training",
    subtitle: "45 min · 12 exercises",
    value: "320 cal",
    valueColor: "#10b981",
    badge: { text: "Verified", color: "#22c55e" },  // optional
    photo: "data:image/...",  // optional
    details: [
      { label: "Duration", value: "45:23" },
      { label: "Exercises", value: "Push-ups, Squats, ..." },
    ],
    items: [  // optional sub-items list
      { icon: "💪", text: "Push-ups 3×15", sub: "Chest · 8cal" },
    ],
  }]
  title: "Training History"
  emptyText: "No history yet"
*/

export default function HistoryPanel({ entries: rawEntries = [], title = "History", emptyText = "No history yet. Start today!" }) {
    const [expandedId, setExpandedId] = useState(null);
    const [limit, setLimit] = useState(20);
    const entries = Array.isArray(rawEntries) ? rawEntries.filter(e => e && typeof e === "object") : [];

    if (entries.length === 0) {
        return (
            <div className="gs" style={{ textAlign: "center", padding: "24px 16px" }}>
                <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.3 }}>📜</div>
                <div style={{ fontSize: 14, color: "#6b7280" }}>{emptyText}</div>
            </div>
        );
    }

    // Group by date
    const grouped = {};
    entries.forEach((e, i) => {
        const key = e.date || "unknown";
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push({ ...e, _idx: i });
    });

    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
    const visibleDates = sortedDates.slice(0, limit);

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div className="sl" style={{ margin: 0 }}>{title} · {entries.length}</div>
                <span style={{ fontSize: 11, color: "#4b5563" }}>{sortedDates.length} days</span>
            </div>

            {visibleDates.map(date => (
                <div key={date} style={{ marginBottom: 16 }}>
                    {/* Date Header */}
                    <div style={{
                        fontSize: 12, fontWeight: 700, color: "#6b7280", fontFamily: "Rajdhani,sans-serif",
                        letterSpacing: 1.5, padding: "4px 0", marginBottom: 6,
                        borderBottom: "1px solid rgba(255,255,255,.04)",
                    }}>
                        {formatDateLabel(date)}
                    </div>

                    {/* Entries for this date */}
                    {grouped[date].map(entry => {
                        const isExpanded = expandedId === entry._idx;
                        return (
                            <div key={entry._idx}
                                onClick={() => setExpandedId(isExpanded ? null : entry._idx)}
                                style={{
                                    padding: "12px 14px", marginBottom: 4, borderRadius: 10, cursor: "pointer",
                                    background: isExpanded ? "rgba(16,185,129,.03)" : "rgba(255,255,255,.015)",
                                    border: isExpanded ? "1px solid rgba(16,185,129,.12)" : "1px solid rgba(255,255,255,.03)",
                                    transition: "all .2s",
                                }}>

                                {/* Main Row */}
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    {/* Icon */}
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                                        background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.05)",
                                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                                    }}>
                                        {entry.photo ? (
                                            <img src={entry.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 9 }} />
                                        ) : entry.icon}
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: "#e5e7eb", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {entry.title}
                                        </div>
                                        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 1 }}>
                                            {entry.subtitle}
                                        </div>
                                    </div>

                                    {/* Value + Badge */}
                                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: entry.valueColor || "#10b981", fontFamily: "Rajdhani,sans-serif" }}>
                                            {entry.value}
                                        </div>
                                        {entry.badge && (
                                            <span style={{
                                                fontSize: 11, padding: "2px 6px", borderRadius: 100,
                                                background: `${entry.badge.color}12`, color: entry.badge.color,
                                                fontWeight: 600,
                                            }}>{entry.badge.text}</span>
                                        )}
                                    </div>

                                    {/* Chevron */}
                                    <span style={{ color: "#4b5563", fontSize: 12, flexShrink: 0 }}>{isExpanded ? "▾" : "▸"}</span>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="fade-in" style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,.04)" }}>
                                        {/* Detail rows */}
                                        {Array.isArray(entry.details) && entry.details.length > 0 && (
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: entry.items?.length ? 10 : 0 }}>
                                                {entry.details.map((d, i) => (
                                                    <div key={i} style={{ padding: "6px 0" }}>
                                                        <div style={{ fontSize: 11, color: "#6b7280" }}>{d.label}</div>
                                                        <div style={{ fontSize: 13, fontWeight: 600, color: d.color || "#e5e7eb" }}>{d.value}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Sub-items */}
                                        {Array.isArray(entry.items) && entry.items.length > 0 && (
                                            <div>
                                                <div style={{ fontSize: 11, color: "#6b7280", fontFamily: "Rajdhani,sans-serif", letterSpacing: 1.5, marginBottom: 6 }}>DETAILS</div>
                                                {entry.items.map((item, i) => (
                                                    <div key={i} style={{
                                                        display: "flex", alignItems: "center", gap: 8,
                                                        padding: "5px 0", borderBottom: i < entry.items.length - 1 ? "1px solid rgba(255,255,255,.02)" : "none",
                                                    }}>
                                                        <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>{item.icon || "·"}</span>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: 12, color: "#d1d5db" }}>{item.text}</div>
                                                            {item.sub && <div style={{ fontSize: 11, color: "#4b5563" }}>{item.sub}</div>}
                                                        </div>
                                                        {item.value && <span style={{ fontSize: 11, color: item.valueColor || "#6b7280", fontWeight: 600 }}>{item.value}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Photo */}
                                        {entry.photo && (
                                            <div style={{ marginTop: 8, textAlign: "center" }}>
                                                <img src={entry.photo} alt="proof" style={{ width: 100, height: 100, borderRadius: 10, objectFit: "cover", border: "1px solid rgba(16,185,129,.2)" }} />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}

            {/* Load More */}
            {sortedDates.length > limit && (
                <button className="bg" onClick={() => setLimit(l => l + 20)} style={{ width: "100%", padding: 12, marginTop: 8 }}>
                    Load More ({sortedDates.length - limit} more days)
                </button>
            )}
        </div>
    );
}
