"use client";
import { useMemo, useRef, useEffect } from 'react';
import { today as todayStr, parseDateKey, dateKey } from '@/utils';
import { hasDayWorkout } from '@/lib/workoutHelpers';

// GitHub-style year activity heatmap
export default function YearHeatmap({ workoutLog = {}, title = "Activity" }) {
    const scrollRef = useRef(null);
    const todayKey = todayStr();
    const data = useMemo(() => {
        // Day keys are LOCAL dates (dateKey in utils). The old code mixed local weekday
        // with a UTC (toISOString) key, so cells could be shifted by a day.
        const base = parseDateKey(todayKey);
        const days = [];
        // Go back 365 days
        for (let i = 364; i >= 0; i--) {
            const d = new Date(base);
            d.setDate(d.getDate() - i);
            const ds = dateKey(d);
            const hasWorkout = hasDayWorkout(workoutLog || {}, ds);
            days.push({ date: ds, active: hasWorkout, day: d.getDay(), month: d.getMonth() });
        }
        return days;
    }, [workoutLog, todayKey]);

    // Start scrolled to the most recent weeks (the grid overflows on phones)
    useEffect(() => {
        const el = scrollRef.current;
        if (el) el.scrollLeft = el.scrollWidth;
    }, [data]);

    const totalActive = data.filter(d => d.active).length;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Group by weeks
    const weeks = [];
    let currentWeek = [];
    data.forEach((d, i) => {
        if (i === 0) {
            // Pad first week
            for (let j = 0; j < d.day; j++) currentWeek.push(null);
        }
        currentWeek.push(d);
        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    });
    if (currentWeek.length > 0) {
        while (currentWeek.length < 7) currentWeek.push(null);
        weeks.push(currentWeek);
    }

    // Month labels
    const monthLabels = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
        const firstDay = week.find(d => d);
        if (firstDay && firstDay.month !== lastMonth) {
            monthLabels.push({ month: months[firstDay.month], col: wi });
            lastMonth = firstDay.month;
        }
    });

    const cellSize = 11;
    const gap = 2;
    const dayLabelW = 14;

    return (
        <div className="gs" style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{title}</div>
                <div style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>{totalActive} days active</div>
            </div>

            <div ref={scrollRef} style={{ overflowX: "auto", paddingBottom: 4 }}>
            {/* Month labels — absolutely positioned over their week column, scroll with the grid */}
            <div style={{ position: "relative", height: 14, marginBottom: 4, width: dayLabelW + gap + weeks.length * (cellSize + gap) }}>
                {monthLabels.map((ml, i) => (
                    <div key={i} style={{ position: "absolute", left: dayLabelW + gap + ml.col * (cellSize + gap), top: 0, fontSize: 11, lineHeight: "14px", color: "#4b5563", whiteSpace: "nowrap" }}>
                        {ml.month}
                    </div>
                ))}
            </div>

            {/* Heatmap grid */}
            <div style={{ display: "flex", gap: gap }}>
                {/* Day labels */}
                <div style={{ display: "flex", flexDirection: "column", gap: gap, paddingTop: 0, flexShrink: 0 }}>
                    {["", "M", "", "W", "", "F", ""].map((d, i) => (
                        <div key={i} style={{ width: dayLabelW, height: cellSize, display: "flex", alignItems: "center", fontSize: 11, color: "#4b5563" }}>{d}</div>
                    ))}
                </div>

                {/* Weeks */}
                {weeks.map((week, wi) => (
                    <div key={wi} style={{ display: "flex", flexDirection: "column", gap: gap }}>
                        {week.map((day, di) => (
                            <div key={di} style={{
                                width: cellSize, height: cellSize, borderRadius: 2,
                                background: !day ? "transparent" : day.active ? "#10b981" : "rgba(255,255,255,.04)",
                                opacity: !day ? 0 : day.active ? (day.date === todayKey ? 1 : 0.75) : 1,
                                border: day?.date === todayKey ? "1px solid #10b981" : "none",
                                boxSizing: "border-box",
                            }} title={day ? `${day.date}: ${day.active ? "Active" : "Rest"}` : ""} />
                        ))}
                    </div>
                ))}
            </div>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6, marginTop: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: "rgba(255,255,255,.04)" }} />
                <span style={{ fontSize: 11, color: "#4b5563" }}>Rest</span>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: "#10b981", opacity: 0.75, marginLeft: 6 }} />
                <span style={{ fontSize: 11, color: "#4b5563" }}>Trained</span>
            </div>
        </div>
    );
}
