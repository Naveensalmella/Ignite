"use client";
import { useState, useRef, useEffect } from 'react';
import { Download, FileImage, Database, Check } from 'lucide-react';
import { Card, IconBadge } from '@/components/ui/kit';
import { getLevel, toArr, today, parseDateKey } from '@/utils';
import useAppStore from '@/stores/useAppStore';
import { playerRank } from '@/lib/system/ranks';
import { countWorkoutDays, getTotalCal, getDayCal, getDayDuration, getDaySplit, hasDayWorkout } from '@/lib/workoutHelpers';
import { APP_VERSION, VERSION_LABEL } from '@/version';

// ctx.roundRect is missing in older Safari/Firefox — fall back to a manual path
function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") { ctx.roundRect(x, y, w, h, r); return; }
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revoking synchronously can cancel the download in Safari/Firefox
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Generate PDF report in browser using canvas
export default function DataExport({ appState: rawAppState = {}, totalXP = 0, streak = 0, workoutLog: rawWorkoutLog = {}, profile: rawProfile = {} }) {
    const appState = rawAppState || {};
    const workoutLog = rawWorkoutLog || {};
    const profile = rawProfile || {};
    const [exporting, setExporting] = useState(false);
    const [done, setDone] = useState(false);
    const doneTimer = useRef(null);
    useEffect(() => () => clearTimeout(doneTimer.current), []);

    const exportPDF = async () => {
        if (exporting) return;
        setExporting(true);

        try {
            const lv = getLevel(totalXP);
            const rank = playerRank(useAppStore.getState().system, lv);
            const d = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
            // workoutLog[date] may be a legacy single object or an array of entries
            const totalWorkouts = countWorkoutDays(workoutLog);
            const totalCal = Math.round(getTotalCal(workoutLog));
            const foodLog = appState.foodLog || {};
            const journal = appState.journal || {};
            const focusLog = appState.focusLog || {};
            const habitLog = appState.habitLog || {};
            const finances = toArr(appState.finances);

            const foodDays = Object.keys(foodLog).filter(k => !k.startsWith("water_") && !k.startsWith("_") && toArr(foodLog[k]).length > 0).length;
            const journalDays = Object.values(journal).filter(e => e?.entry?.length > 10).length;
            const focusSessions = Object.values(focusLog).reduce((s, v) => s + toArr(v).length, 0);
            // habitLog[date] is {habitId: bool} (legacy: array of ids) — count completed quests
            const totalQuests = Object.values(habitLog).reduce((s, v) => s + (Array.isArray(v) ? v.length : v && typeof v === "object" ? Object.values(v).filter(x => x === true).length : 0), 0);

            // Recent workouts (last 10 days with a workout)
            const recentWorkouts = Object.keys(workoutLog)
                .filter(date => hasDayWorkout(workoutLog, date))
                .sort((a, b) => b.localeCompare(a))
                .slice(0, 10)
                .map(date => {
                    const dur = Math.round(getDayDuration(workoutLog, date));
                    const parsed = parseDateKey(date);
                    return {
                        date: isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
                        name: String(getDaySplit(workoutLog, date) || "Training"),
                        cal: Math.round(getDayCal(workoutLog, date)),
                        dur: dur ? `${Math.floor(dur / 60)}m ${dur % 60}s` : "—",
                    };
                });

            // Build PDF using canvas → image → downloadable
            const canvas = document.createElement("canvas");
            const W = 595, H = 842; // A4 proportions
            canvas.width = W * 2; canvas.height = H * 2;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Canvas not supported");
            ctx.scale(2, 2);

            // Background
            ctx.fillStyle = "#0d1117";
            ctx.fillRect(0, 0, W, H);

            // Header gradient bar
            const grad = ctx.createLinearGradient(0, 0, W, 0);
            grad.addColorStop(0, "#38bdf8"); grad.addColorStop(1, "#06b6d4");
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
            ctx.fillStyle = "#38bdf8";
            ctx.fillRect(30, 85, W - 60, 1);

            // ── PROFILE SECTION ──
            let y = 110;
            ctx.fillStyle = "#38bdf8";
            ctx.font = "bold 16px Rajdhani, sans-serif";
            ctx.fillText("👤 PROFILE", 30, y);
            y += 25;

            ctx.fillStyle = "#d1d5db";
            ctx.font = "13px Inter, sans-serif";
            const profileItems = [
                [`Name: ${profile.name || "—"}`, `Age: ${profile.age || "—"}`],
                [`Weight: ${profile.weight || "—"} kg`, `Height: ${profile.height || "—"} cm`],
                [`Goal: ${String(profile.goal || "—").toUpperCase()}`, `Level: ${profile.fitnessLevel || "—"}`],
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
            ctx.fillStyle = "#38bdf8";
            ctx.font = "bold 16px Rajdhani, sans-serif";
            ctx.fillText("📊 LIFETIME STATS", 30, y);
            y += 10;

            // Stats boxes
            const stats = [
                ["⚡", `${Number(totalXP || 0).toLocaleString()}`, "Total XP"],
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
                roundRectPath(ctx, bx, by, boxW, boxH, 8);
                ctx.fill();

                ctx.fillStyle = "#38bdf8";
                ctx.font = "bold 18px Rajdhani, sans-serif";
                ctx.fillText(val, bx + 10, by + 25);

                ctx.fillStyle = "#6b7280";
                ctx.font = "10px Inter, sans-serif";
                ctx.fillText(`${icon} ${label}`, bx + 10, by + 42);
            });

            y += 15 + Math.ceil(stats.length / cols) * (boxH + gap) + 15;

            // ── RECENT WORKOUTS ──
            ctx.fillStyle = "#38bdf8";
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
            ctx.fillText(`IGNITE ${VERSION_LABEL} · ${profile.name || "Warrior"} · ${rank.emoji} ${rank.name} · Generated ${d}`, 30, H - 25);

            ctx.fillStyle = "#38bdf8";
            ctx.fillRect(30, H - 35, W - 60, 1);

            // Convert to PDF-like download (PNG image of the report)
            const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
            if (!blob) throw new Error("Could not render report image");
            downloadBlob(blob, `IGNITE-Report-${today()}.png`);
            setDone(true);
            clearTimeout(doneTimer.current);
            doneTimer.current = setTimeout(() => setDone(false), 3000);
        } catch (e) {
            console.error("Export error:", e);
        }
        setExporting(false);
    };

    // Also keep JSON export option
    const exportJSON = () => {
        try {
            const data = {
                exportDate: new Date().toISOString(), appVersion: APP_VERSION, profile, totalXP, streak, workoutLog,
                ...Object.fromEntries(["foodLog", "habitLog", "habits", "tasks", "journal", "finances", "focusLog", "pillarProg", "routineData", "masteryData", "bodyData", "challengeData", "freezeData", "programState", "xpLog", "loginData", "activeTitle", "questChainData", "oracleChats"].map(k => [k, appState[k] ?? null])),
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            downloadBlob(blob, `ignite-backup-${today()}.json`);
        } catch (e) {
            console.error("JSON export error:", e);
        }
    };

    return (
        <Card>
            <div className="flex items-center gap-3 mb-3">
                <IconBadge icon={Download} tone="teal" size={38} />
                <div className="flex-1 min-w-0">
                    <div className="card-title">Export progress</div>
                    <div className="row-sub">Download your IGNITE journey</div>
                </div>
            </div>
            <div className="flex gap-2">
                <button type="button" className="bp flex-1" onClick={exportPDF} disabled={exporting} style={{ fontSize: 13 }}>
                    {exporting ? "Generating…" : done ? <><Check size={15} /> Downloaded</> : <><FileImage size={15} /> Report (image)</>}
                </button>
                <button type="button" className="bg" onClick={exportJSON} style={{ fontSize: 13 }}>
                    <Database size={15} /> Raw data
                </button>
            </div>
        </Card>
    );
}
