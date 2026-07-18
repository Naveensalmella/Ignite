import { useState } from 'react';
import { getLevel, getRank } from '../utils';

// Generate PDF report in browser using canvas
export default function DataExport({ appState, totalXP, streak, workoutLog, profile }) {
    const [exporting, setExporting] = useState(false);
    const [done, setDone] = useState(false);

    const exportPDF = async () => {
        setExporting(true);

        try {
            const lv = getLevel(totalXP);
            const rank = getRank(lv);
            const d = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
            const totalWorkouts = Object.keys(workoutLog || {}).length;
            const totalCal = Object.values(workoutLog || {}).reduce((s, w) => s + (w.calBurned || 0), 0);
            const foodLog = appState.foodLog || {};
            const journal = appState.journal || {};
            const focusLog = appState.focusLog || {};
            const habits = appState.habits || [];
            const habitLog = appState.habitLog || {};
            const finances = appState.finances || [];

            const foodDays = Object.keys(foodLog).filter(k => !k.startsWith("water_") && Array.isArray(foodLog[k]) && foodLog[k].length > 0).length;
            const journalDays = Object.values(journal).filter(e => e?.entry?.length > 10).length;
            const focusSessions = Object.values(focusLog).flat().length;
            const totalQuests = Object.values(habitLog).reduce((s, arr) => s + (Array.isArray(arr) ? arr.length : 0), 0);

            // Recent workouts (last 10)
            const recentWorkouts = Object.entries(workoutLog)
                .sort((a, b) => b[0].localeCompare(a[0]))
                .slice(0, 10)
                .map(([date, w]) => ({
                    date: new Date(date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
                    name: w.splitName || "Training",
                    cal: w.calBurned || 0,
                    dur: w.duration ? `${Math.floor(w.duration / 60)}m ${w.duration % 60}s` : "—",
                }));

            // Build PDF using canvas → image → downloadable
            const canvas = document.createElement("canvas");
            const W = 595, H = 842; // A4 proportions
            canvas.width = W * 2; canvas.height = H * 2;
            const ctx = canvas.getContext("2d");
            ctx.scale(2, 2);

            // Background
            ctx.fillStyle = "#0d1117";
            ctx.fillRect(0, 0, W, H);

            // Header gradient bar
            const grad = ctx.createLinearGradient(0, 0, W, 0);
            grad.addColorStop(0, "#10b981"); grad.addColorStop(1, "#06b6d4");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, 6);

            // Title
            ctx.fillStyle = "#f3f4f6";
            ctx.font = "bold 28px Rajdhani, sans-serif";
            ctx.fillText("🔥 IGNITE — Progress Report", 30, 50);

            ctx.fillStyle = "#6b7280";
            ctx.font = "13px Inter, sans-serif";
            ctx.fillText(`Generated on ${d} for ${profile.name || "Warrior"}`, 30, 72);

            // Separator
            ctx.fillStyle = "#10b981";
            ctx.fillRect(30, 85, W - 60, 1);

            // ── PROFILE SECTION ──
            let y = 110;
            ctx.fillStyle = "#10b981";
            ctx.font = "bold 16px Rajdhani, sans-serif";
            ctx.fillText("👤 PROFILE", 30, y);
            y += 25;

            ctx.fillStyle = "#d1d5db";
            ctx.font = "13px Inter, sans-serif";
            const profileItems = [
                [`Name: ${profile.name || "—"}`, `Age: ${profile.age || "—"}`],
                [`Weight: ${profile.weight || "—"} kg`, `Height: ${profile.height || "—"} cm`],
                [`Goal: ${(profile.goal || "—").toUpperCase()}`, `Level: ${profile.fitnessLevel || "—"}`],
                [`Training: ${profile.trainingType || "—"}`, `Daily Time: ${profile.dailyTime || 45} min`],
            ];
            profileItems.forEach(([left, right]) => {
                ctx.fillStyle = "#d1d5db";
                ctx.fillText(left, 40, y);
                ctx.fillText(right, 280, y);
                y += 20;
            });

            // ── STATS SECTION ──
            y += 15;
            ctx.fillStyle = "#10b981";
            ctx.font = "bold 16px Rajdhani, sans-serif";
            ctx.fillText("📊 LIFETIME STATS", 30, y);
            y += 10;

            // Stats boxes
            const stats = [
                ["⚡", `${totalXP.toLocaleString()}`, "Total XP"],
                ["⚔️", `Lv.${lv}`, rank.name],
                ["🔥", `${streak}`, "Day Streak"],
                ["🏋️", `${totalWorkouts}`, "Workouts"],
                ["💪", `${totalCal.toLocaleString()}`, "Cal Burned"],
                ["🍎", `${foodDays}`, "Days Tracked"],
                ["📝", `${journalDays}`, "Journal Days"],
                ["🎯", `${totalQuests}`, "Quests Done"],
                ["⏱", `${focusSessions}`, "Focus Sessions"],
                ["💰", `${finances.length}`, "Transactions"],
            ];

            const boxW = 100, boxH = 55, gap = 10, cols = 5;
            stats.forEach(([icon, val, label], i) => {
                const col = i % cols, row = Math.floor(i / cols);
                const bx = 30 + col * (boxW + gap), by = y + 15 + row * (boxH + gap);

                ctx.fillStyle = "rgba(255,255,255,0.03)";
                ctx.beginPath();
                ctx.roundRect(bx, by, boxW, boxH, 8);
                ctx.fill();

                ctx.fillStyle = "#10b981";
                ctx.font = "bold 18px Rajdhani, sans-serif";
                ctx.fillText(val, bx + 10, by + 25);

                ctx.fillStyle = "#6b7280";
                ctx.font = "10px Inter, sans-serif";
                ctx.fillText(`${icon} ${label}`, bx + 10, by + 42);
            });

            y += 15 + Math.ceil(stats.length / cols) * (boxH + gap) + 15;

            // ── RECENT WORKOUTS ──
            ctx.fillStyle = "#10b981";
            ctx.font = "bold 16px Rajdhani, sans-serif";
            ctx.fillText("⚔️ RECENT WORKOUTS", 30, y);
            y += 8;

            // Table header
            y += 18;
            ctx.fillStyle = "#4b5563";
            ctx.font = "bold 11px Inter, sans-serif";
            ctx.fillText("DATE", 40, y);
            ctx.fillText("WORKOUT", 120, y);
            ctx.fillText("CALORIES", 380, y);
            ctx.fillText("DURATION", 470, y);

            ctx.fillStyle = "rgba(255,255,255,0.06)";
            ctx.fillRect(30, y + 5, W - 60, 1);
            y += 20;

            recentWorkouts.forEach(w => {
                if (y > H - 80) return;
                ctx.fillStyle = "#d1d5db";
                ctx.font = "12px Inter, sans-serif";
                ctx.fillText(w.date, 40, y);
                ctx.fillText(w.name.length > 30 ? w.name.slice(0, 30) + "..." : w.name, 120, y);
                ctx.fillStyle = "#f59e0b";
                ctx.fillText(`${w.cal} cal`, 380, y);
                ctx.fillStyle = "#06b6d4";
                ctx.fillText(w.dur, 470, y);

                ctx.fillStyle = "rgba(255,255,255,0.02)";
                ctx.fillRect(30, y + 5, W - 60, 1);
                y += 22;
            });

            if (recentWorkouts.length === 0) {
                ctx.fillStyle = "#4b5563";
                ctx.font = "12px Inter, sans-serif";
                ctx.fillText("No workouts logged yet.", 40, y);
                y += 22;
            }

            // ── FOOTER ──
            ctx.fillStyle = "#4b5563";
            ctx.font = "10px Inter, sans-serif";
            ctx.fillText(`IGNITE v2.0 · ${profile.name || "Warrior"} · ${rank.emoji} ${rank.name} · Generated ${d}`, 30, H - 25);

            ctx.fillStyle = "#10b981";
            ctx.fillRect(30, H - 35, W - 60, 1);

            // Convert to PDF-like download (PNG image of the report)
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `IGNITE-Report-${new Date().toISOString().split("T")[0]}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                setDone(true);
                setTimeout(() => setDone(false), 3000);
            }, "image/png");

        } catch (e) {
            console.error("Export error:", e);
        }
        setExporting(false);
    };

    // Also keep JSON export option
    const exportJSON = () => {
        const data = {
            exportDate: new Date().toISOString(), appVersion: "2.0", profile, totalXP, streak, workoutLog,
            ...Object.fromEntries(["foodLog", "habitLog", "habits", "tasks", "journal", "finances", "focusLog", "pillarProg", "routineData", "masteryData", "bodyData", "challengeData", "freezeData", "oracleChats"].map(k => [k, appState[k]])),
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `ignite-backup-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="gs" style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <span style={{ fontSize: 24 }}>📊</span>
                <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>Export Progress</div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>Download your IGNITE journey</div>
                </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
                <button className="bp" onClick={exportPDF} disabled={exporting} style={{ flex: 1, padding: "12px 16px", fontSize: 13 }}>
                    {exporting ? "Generating..." : done ? "✓ Downloaded!" : "📄 Report (Image)"}
                </button>
                <button className="bg" onClick={exportJSON} style={{ padding: "12px 16px", fontSize: 13 }}>
                    💾 Raw Data
                </button>
            </div>
        </div>
    );
}