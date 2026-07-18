import { useMemo } from 'react';

// GitHub-style year activity heatmap
export default function YearHeatmap({ workoutLog, title = "Activity" }) {
    const data = useMemo(() => {
        const today = new Date();
        const days = [];
        // Go back 365 days
        for (let i = 364; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const ds = d.toISOString().split("T")[0];
            const hasWorkout = !!workoutLog[ds];
            days.push({ date: ds, active: hasWorkout, day: d.getDay(), month: d.getMonth() });
        }
        return days;
    }, [workoutLog]);

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

    return (
        <div className="gs" style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{title}</div>
                <div style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>{totalActive} days active</div>
            </div>

            {/* Month labels */}
            <div style={{ display: "flex", marginBottom: 4, paddingLeft: 20, gap: 0 }}>
                {monthLabels.map((ml, i) => (
                    <div key={i} style={{ position: "relative", left: ml.col * (cellSize + gap) - (i > 0 ? monthLabels[i - 1].col * (cellSize + gap) + 30 : 0), fontSize: 9, color: "#4b5563", minWidth: 30 }}>
                        {ml.month}
                    </div>
                ))}
            </div>

            {/* Heatmap grid */}
            <div style={{ display: "flex", gap: gap, overflowX: "auto", paddingBottom: 4 }}>
                {/* Day labels */}
                <div style={{ display: "flex", flexDirection: "column", gap: gap, paddingTop: 0, flexShrink: 0 }}>
                    {["", "M", "", "W", "", "F", ""].map((d, i) => (
                        <div key={i} style={{ width: 14, height: cellSize, display: "flex", alignItems: "center", fontSize: 8, color: "#4b5563" }}>{d}</div>
                    ))}
                </div>

                {/* Weeks */}
                {weeks.map((week, wi) => (
                    <div key={wi} style={{ display: "flex", flexDirection: "column", gap: gap }}>
                        {week.map((day, di) => (
                            <div key={di} style={{
                                width: cellSize, height: cellSize, borderRadius: 2,
                                background: !day ? "transparent" : day.active ? "#10b981" : "rgba(255,255,255,.04)",
                                opacity: !day ? 0 : day.active ? (day.date === new Date().toISOString().split("T")[0] ? 1 : 0.75) : 1,
                                border: day?.date === new Date().toISOString().split("T")[0] ? "1px solid #10b981" : "none",
                            }} title={day ? `${day.date}: ${day.active ? "Active" : "Rest"}` : ""} />
                        ))}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6, marginTop: 8 }}>
                <span style={{ fontSize: 9, color: "#4b5563" }}>Less</span>
                {[.04, .2, .45, .75, 1].map((o, i) => (
                    <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: i === 0 ? "rgba(255,255,255,.04)" : "#10b981", opacity: i === 0 ? 1 : o }} />
                ))}
                <span style={{ fontSize: 9, color: "#4b5563" }}>More</span>
            </div>
        </div>
    );
}