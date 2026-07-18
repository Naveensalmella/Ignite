import { useMemo } from 'react';
import { getLevel, getRank } from '../utils';

export default function WeeklyReport({ totalXP, streak, workoutLog, foodLog, habitLog, focusLog }) {
    const report = useMemo(() => {
        const today = new Date();
        const weekDays = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            weekDays.push(d.toISOString().split("T")[0]);
        }

        const workouts = weekDays.filter(d => workoutLog[d]).length;
        const totalCal = weekDays.reduce((s, d) => {
            const w = workoutLog[d];
            return s + (w?.calBurned || 0);
        }, 0);
        const totalDuration = weekDays.reduce((s, d) => {
            const w = workoutLog[d];
            return s + (w?.duration || 0);
        }, 0);
        const foodDays = weekDays.filter(d => (foodLog[d] || []).length > 0).length;
        const totalFoodCal = weekDays.reduce((s, d) => {
            return s + (foodLog[d] || []).reduce((fs, f) => fs + (f.cal || 0), 0);
        }, 0);
        const focusMins = weekDays.reduce((s, d) => {
            const sessions = focusLog[d] || [];
            return s + (Array.isArray(sessions) ? sessions.reduce((fs, f) => fs + (f.duration || 0), 0) : 0);
        }, 0);

        const level = getLevel(totalXP);
        const rank = getRank(level);

        return { weekDays, workouts, totalCal, totalDuration, foodDays, totalFoodCal, focusMins, level, rank };
    }, [totalXP, workoutLog, foodLog, focusLog]);

    const fmt = s => `${Math.floor(s / 60)}h ${s % 60}m`;
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
        <div className="gs" style={{ padding: 20 }}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "#6b7280", fontFamily: "Rajdhani,sans-serif", letterSpacing: 2 }}>WEEKLY REPORT</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginTop: 4 }}>This Week's Progress</div>
            </div>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 16 }}>
                {[
                    ["⚔️", report.workouts, "/7 days", "Workouts", "#10b981"],
                    ["🔥", report.totalCal, "cal", "Burned", "#ef4444"],
                    ["⏱", fmt(Math.floor(report.totalDuration / 60)), "", "Train Time", "#06b6d4"],
                    ["🍎", report.foodDays, "/7 days", "Food Logged", "#f59e0b"],
                    ["📊", report.totalFoodCal.toLocaleString(), "cal", "Eaten", "#8b5cf6"],
                    ["⏱", Math.round(report.focusMins / 60), "min", "Focus Time", "#06b6d4"],
                ].map(([icon, val, unit, label, color]) => (
                    <div key={label} style={{ textAlign: "center", padding: 14, background: "rgba(255,255,255,.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,.04)" }}>
                        <div style={{ fontSize: 16 }}>{icon}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: "Rajdhani,sans-serif" }}>{val}<span style={{ fontSize: 12, color: "#6b7280" }}>{unit}</span></div>
                        <div style={{ fontSize: 10, color: "#4b5563" }}>{label}</div>
                    </div>
                ))}
            </div>

            {/* Day-by-day */}
            <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 8 }}>Day by Day</div>
                <div style={{ display: "flex", gap: 6 }}>
                    {report.weekDays.map((d, i) => {
                        const worked = !!workoutLog[d];
                        const dayName = dayNames[new Date(d + 'T00:00:00').getDay()];
                        const isToday = d === new Date().toISOString().split("T")[0];
                        return (
                            <div key={d} style={{
                                flex: 1, textAlign: "center", padding: "8px 4px", borderRadius: 10,
                                background: worked ? "rgba(16,185,129,.08)" : "rgba(255,255,255,.02)",
                                border: isToday ? "1px solid rgba(16,185,129,.3)" : "1px solid rgba(255,255,255,.04)",
                            }}>
                                <div style={{ fontSize: 10, color: "#4b5563" }}>{dayName}</div>
                                <div style={{ fontSize: 16, marginTop: 2 }}>{worked ? "✅" : "·"}</div>
                                <div style={{ fontSize: 9, color: "#4b5563" }}>{new Date(d + 'T00:00:00').getDate()}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Level + Streak */}
            <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1, textAlign: "center", padding: 12, background: "rgba(16,185,129,.04)", borderRadius: 10, border: "1px solid rgba(16,185,129,.08)" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#10b981", fontFamily: "Rajdhani,sans-serif" }}>Lv.{report.level}</div>
                    <div style={{ fontSize: 10, color: report.rank.color }}>{report.rank.name}</div>
                </div>
                <div style={{ flex: 1, textAlign: "center", padding: 12, background: "rgba(239,68,68,.04)", borderRadius: 10, border: "1px solid rgba(239,68,68,.08)" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#ef4444", fontFamily: "Rajdhani,sans-serif" }}>{streak}d</div>
                    <div style={{ fontSize: 10, color: "#6b7280" }}>Streak</div>
                </div>
            </div>
        </div>
    );
}