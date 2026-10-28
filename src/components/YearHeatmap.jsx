"use client";
import { useMemo, useRef, useEffect } from 'react';
import { today as todayStr, parseDateKey, dateKey } from '@/utils';
import { hasDayWorkout } from '@/lib/workoutHelpers';
import { Card } from '@/components/ui/kit';

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

    const restBg = "var(--track)";
    const activeBg = "var(--accent)";

    return (
        <Card title={title} action={<span className="text-[12.5px] font-semibold num" style={{ color: "var(--accent)" }}>{totalActive} days active</span>}>
            <div ref={scrollRef} className="no-scrollbar" style={{ overflowX: "auto", paddingBottom: 2 }}>
            {/* Month labels — absolutely positioned over their week column, scroll with the grid */}
            <div style={{ position: "relative", height: 14, marginBottom: 4, width: dayLabelW + gap + weeks.length * (cellSize + gap) }}>
                {monthLabels.map((ml, i) => (
                    <div key={i} style={{ position: "absolute", left: dayLabelW + gap + ml.col * (cellSize + gap), top: 0, fontSize: 11, lineHeight: "14px", color: "var(--text-dim)", whiteSpace: "nowrap" }}>
                        {ml.month}
                    </div>
                ))}
            </div>

            {/* Heatmap grid */}
            <div style={{ display: "flex", gap: gap }}>
                {/* Day labels */}
                <div style={{ display: "flex", flexDirection: "column", gap: gap, paddingTop: 0, flexShrink: 0 }}>
                    {["", "M", "", "W", "", "F", ""].map((d, i) => (
                        <div key={i} style={{ width: dayLabelW, height: cellSize, display: "flex", alignItems: "center", fontSize: 10, color: "var(--text-dim)" }}>{d}</div>
                    ))}
                </div>

                {/* Weeks */}
                {weeks.map((week, wi) => (
                    <div key={wi} style={{ display: "flex", flexDirection: "column", gap: gap }}>
                        {week.map((day, di) => (
                            <div key={di} style={{
                                width: cellSize, height: cellSize, borderRadius: 3,
                                background: !day ? "transparent" : day.active ? activeBg : restBg,
                                opacity: !day ? 0 : day.active ? (day.date === todayKey ? 1 : 0.8) : 1,
                                boxShadow: day?.date === todayKey ? "0 0 0 1.5px var(--accent) inset" : "none",
                            }} title={day ? `${day.date}: ${day.active ? "Active" : "Rest"}` : ""} />
                        ))}
                    </div>
                ))}
            </div>
            </div>

            {/* Legend */}
            <div className="flex justify-end items-center gap-3 mt-2.5">
                <span className="legend"><i style={{ background: restBg }} />Rest</span>
                <span className="legend"><i style={{ background: activeBg, opacity: 0.8 }} />Trained</span>
            </div>
        </Card>
    );
}
