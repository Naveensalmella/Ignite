"use client";
// ═══════════════════════════════════════
// IGNITE — History Panel
// Reusable date-grouped, expandable history view
// ═══════════════════════════════════════
import { useState } from 'react';
import { History, ChevronDown } from 'lucide-react';
import { today as todayKey, addDays, parseDateKey } from '@/utils';
import { Card, EmptyState } from '@/components/ui/kit';

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
    valueColor: "#38bdf8",
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
            <Card>
                <EmptyState icon={History} title="Nothing here yet">{emptyText}</EmptyState>
            </Card>
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
        <Card title={`${title} · ${entries.length}`} sub={`${sortedDates.length} days`}>
            {visibleDates.map((date, di) => (
                <div key={date} className={di > 0 ? "mt-3" : ""}>
                    {/* Date header */}
                    <div className="text-[12px] font-bold pb-1" style={{ color: "var(--text-dim)" }}>
                        {formatDateLabel(date)}
                    </div>

                    {/* Entries for this date */}
                    {grouped[date].map(entry => {
                        const isExpanded = expandedId === entry._idx;
                        return (
                            <div key={entry._idx} style={{ borderTop: "1px solid var(--line)" }}>
                                {/* Main row */}
                                <button type="button" aria-expanded={isExpanded}
                                    onClick={() => setExpandedId(isExpanded ? null : entry._idx)}
                                    className="flex items-center gap-3 w-full text-left py-2.5 bg-transparent border-0 cursor-pointer" style={{ color: "inherit" }}>
                                    {/* Icon (entry data — emoji or photo) */}
                                    <span className="flex items-center justify-center shrink-0 overflow-hidden text-[19px]"
                                        style={{ width: 40, height: 40, borderRadius: 12, background: "var(--ghost-bg)" }} aria-hidden="true">
                                        {entry.photo ? (
                                            <img src={entry.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        ) : entry.icon}
                                    </span>

                                    {/* Info */}
                                    <span className="flex-1 min-w-0">
                                        <span className="row-title block truncate">{entry.title}</span>
                                        {entry.subtitle && <span className="row-sub block">{entry.subtitle}</span>}
                                    </span>

                                    {/* Value + badge */}
                                    <span className="flex flex-col items-end shrink-0 gap-0.5">
                                        <span className="text-[14px] font-bold num" style={{ color: entry.valueColor || "var(--accent)" }}>
                                            {entry.value}
                                        </span>
                                        {entry.badge && (
                                            <span className="text-[11px] font-semibold rounded-full px-1.5 py-px" style={{
                                                background: `color-mix(in srgb, ${entry.badge.color || "var(--accent)"} 14%, transparent)`, color: entry.badge.color || "var(--accent)",
                                            }}>{entry.badge.text}</span>
                                        )}
                                    </span>

                                    <ChevronDown size={16} className="shrink-0 transition-transform duration-200"
                                        style={{ color: "var(--text-dim)", transform: isExpanded ? "rotate(180deg)" : "none" }} aria-hidden="true" />
                                </button>

                                {/* Expanded details */}
                                {isExpanded && (
                                    <div className="fade-in mb-3 rounded-[14px] p-3" style={{ background: "var(--ghost-bg)" }}>
                                        {/* Detail rows */}
                                        {Array.isArray(entry.details) && entry.details.length > 0 && (
                                            <div className="grid grid-cols-2 gap-x-3 gap-y-2" style={{ marginBottom: entry.items?.length ? 10 : 0 }}>
                                                {entry.details.map((d, i) => (
                                                    <div key={i}>
                                                        <div className="text-[11.5px]" style={{ color: "var(--text-dim)" }}>{d.label}</div>
                                                        <div className="text-[13px] font-semibold" style={{ color: d.color || "var(--text-primary)" }}>{d.value}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Sub-items */}
                                        {Array.isArray(entry.items) && entry.items.length > 0 && (
                                            <div>
                                                <div className="text-[11.5px] font-bold mb-1" style={{ color: "var(--text-secondary)" }}>Details</div>
                                                {entry.items.map((item, i) => (
                                                    <div key={i} className="flex items-center gap-2 py-1.5"
                                                        style={{ borderTop: i > 0 ? "1px solid var(--line)" : "none" }}>
                                                        <span className="text-[14px] w-5 text-center shrink-0" aria-hidden="true">{item.icon || "·"}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-[12.5px]" style={{ color: "var(--text-primary)" }}>{item.text}</div>
                                                            {item.sub && <div className="text-[11.5px]" style={{ color: "var(--text-dim)" }}>{item.sub}</div>}
                                                        </div>
                                                        {item.value && <span className="text-[11.5px] font-semibold shrink-0" style={{ color: item.valueColor || "var(--text-secondary)" }}>{item.value}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Photo */}
                                        {entry.photo && (
                                            <div className="mt-2 text-center">
                                                <img src={entry.photo} alt="proof" className="inline-block" style={{ width: 100, height: 100, borderRadius: 12, objectFit: "cover", border: "1px solid var(--line)" }} />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}

            {/* Load more */}
            {sortedDates.length > limit && (
                <button type="button" className="bg w-full mt-3" onClick={() => setLimit(l => l + 20)}>
                    Load more ({sortedDates.length - limit} more days)
                </button>
            )}
        </Card>
    );
}
