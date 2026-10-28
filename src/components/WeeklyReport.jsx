"use client";
import { useMemo } from 'react';
import { getLevel, getRank, today, toArr, addDays, parseDateKey } from '@/utils';
import { hasDayWorkout, getDayCal, getDayDuration } from '@/lib/workoutHelpers';

// Props: totalXP, streak, workoutLog, foodLog, habitLog (unused), focusLog
export default function WeeklyReport({ totalXP = 0, streak = 0, workoutLog = {}, foodLog = {}, focusLog = {} }) {
    const todayKey = today();
    const report = useMemo(() => {
        // Day keys are LOCAL dates (see today()/addDays in utils)
        const weekDays = [];
        for (let i = 6; i >= 0; i--) weekDays.push(addDays(-i, todayKey));

        const wl = workoutLog || {}, fl = foodLog || {}, fo = focusLog || {};
        const workouts = weekDays.filter(d => hasDayWorkout(wl, d)).length;
        const totalCal = weekDays.reduce((s, d) => s + getDayCal(wl, d), 0);
        const totalDuration = weekDays.reduce((s, d) => s + getDayDuration(wl, d), 0);
        const foodDays = weekDays.filter(d => toArr(fl[d]).length > 0).length;
        const totalFoodCal = weekDays.reduce((s, d) => {
            return s + toArr(fl[d]).reduce((fs, f) => fs + (Number(f?.cal) || 0), 0);
        }, 0);
        // Focus session durations are stored in minutes
        const focusMins = weekDays.reduce((s, d) => {
            const sessions = toArr(fo[d]);
            return s + sessions.reduce((fs, f) => fs + (Number(f?.duration) || 0), 0);
        }, 0);

        const level = getLevel(totalXP);
        const rank = getRank(level);

        return { weekDays, workouts, totalCal, totalDuration, foodDays, totalFoodCal, focusMins, level, rank };
    }, [totalXP, workoutLog, foodLog, focusLog, todayKey]);

    const fmt = s => `${Math.floor(s / 60)}h ${s % 60}m`;
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
        <div className="gs" style={{ padding: 20 }}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "#6b7280", fontFamily: "Rajdhani,sans-serif", letterSpacing: 2 }}>WEEKLY REPORT</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginTop: 4 }}>This Week&apos;s Progress</div>
            </div>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 16 }}>
                {[
                    ["⚔️", report.workouts, "/7 days", "Workouts", "#10b981"],
                    ["🔥", Math.round(report.totalCal).toLocaleString(), "cal", "Burned", "#ef4444"],
                    ["⏱", fmt(Math.floor(report.totalDuration / 60)), "", "Train Time", "#06b6d4"],
                    ["🍎", report.foodDays, "/7 days", "Food Logged", "#f59e0b"],
                    ["📊", Math.round(report.totalFoodCal).toLocaleString(), "cal", "Eaten", "#8b5cf6"],
                    ["🎯", fmt(Math.round(report.focusMins)), "", "Focus Time", "#06b6d4"],
                ].map(([icon, val, unit, label, color]) => (
                    <div key={label} style={{ textAlign: "center", padding: 14, background: "rgba(255,255,255,.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,.04)" }}>
                        <div style={{ fontSize: 16 }}>{icon}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: "Rajdhani,sans-serif" }}>{val}<span style={{ fontSize: 12, color: "#6b7280" }}>{unit}</span></div>
                        <div style={{ fontSize: 11, color: "#4b5563" }}>{label}</div>
                    </div>
                ))}
            </div>

            {/* Day-by-day */}
            <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 8 }}>Day by Day</div>
                <div style={{ display: "flex", gap: 6 }}>
                    {report.weekDays.map(d => {
                        const worked = hasDayWorkout(workoutLog || {}, d);
                        const dayName = dayNames[parseDateKey(d).getDay()];
                        const isToday = d === todayKey;
                        return (
                            <div key={d} style={{
                                flex: 1, textAlign: "center", padding: "8px 4px", borderRadius: 10,
                                background: worked ? "rgba(16,185,129,.08)" : "rgba(255,255,255,.02)",
                                border: isToday ? "1px solid rgba(16,185,129,.3)" : "1px solid rgba(255,255,255,.04)",
                            }}>
                                <div style={{ fontSize: 11, color: "#4b5563" }}>{dayName}</div>
                                <div style={{ fontSize: 16, marginTop: 2 }}>{worked ? "✅" : "·"}</div>
                                <div style={{ fontSize: 11, color: "#4b5563" }}>{parseDateKey(d).getDate()}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Level + Streak */}
            <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1, textAlign: "center", padding: 12, background: "rgba(16,185,129,.04)", borderRadius: 10, border: "1px solid rgba(16,185,129,.08)" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#10b981", fontFamily: "Rajdhani,sans-serif" }}>Lv.{report.level}</div>
                    <div style={{ fontSize: 11, color: report.rank.color }}>{report.rank.name}</div>
                </div>
                <div style={{ flex: 1, textAlign: "center", padding: 12, background: "rgba(239,68,68,.04)", borderRadius: 10, border: "1px solid rgba(239,68,68,.08)" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#ef4444", fontFamily: "Rajdhani,sans-serif" }}>{streak}d</div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>Streak</div>
                </div>
            </div>
        </div>
    );
}
